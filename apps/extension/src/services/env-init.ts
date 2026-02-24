import path from "path";
import fs from "fs";
import * as vscode from "vscode";
import { Uri } from "vscode";
import {
  getRepoAndEnvIds,
  getAllEnvFiles,
  getCurrentWorkspaceId,
  type WorkspaceIdentity,
} from "../utils/repo-detection";
import type { Env } from "../api/types";
import { EnvvalMetadataStore, type EnvMetadata } from "./metadata-store";
import { RepoMigrationService } from "./repo-migration";
import { RepoIdentityStore } from "./repo-identity-store";
import { WorkspaceContextProvider } from "./workspace-context-provider";
import { WorkspaceValidator } from "./workspace-validator";
import { PromptIgnoreStore } from "./prompt-ignore-store";
import { EnvvalApiClient } from "../api/client";
import { EnvvalVsCodeSecrets } from "../utils/secrets";
import {
  hashEnv,
  encryptEnv,
  decryptEnv,
  deriveKeyAsync,
  countEnvVars,
} from "../utils/crypto";
import { StatusBar } from "../ui/status-bar";
import { Logger } from "../utils/logger";
import {
  IGNORE_INTERVAL_MS,
  MAX_ENV_FILE_SIZE_BYTES,
  REPO_REGISTRATION_SKIPPED_KEY,
} from "../lib/constants";
import {
  validateFilePath,
  toWorkspaceRelativePath,
} from "../utils/path-validator";
import { formatError } from "../utils/format-error";
import {
  showInitPrompt,
  showRestorePrompt,
  showFirstTimeSyncPrompt,
  showZombiePrompt,
  showRepoRegistrationPrompt,
  showRepoNamePrompt,
  showEmptyFileConfirmation,
  showSuccess,
  showError,
} from "../ui/dialog/init-prompt";

/**
 * Service responsible for the initial discovery and synchronization of environment files.
 * Handles first-run scenarios: new workspace, new env file, or server-side restore.
 */
export class EnvInitService {
  private static instance: EnvInitService;
  private readonly context: vscode.ExtensionContext;
  private readonly metadataStore: EnvvalMetadataStore;
  private readonly apiClient: EnvvalApiClient;
  private readonly secretsManager: EnvvalVsCodeSecrets;
  private readonly promptIgnoreStore: PromptIgnoreStore;
  private readonly logger: Logger;

  private constructor(
    context: vscode.ExtensionContext,
    metadataStore: EnvvalMetadataStore,
    apiClient: EnvvalApiClient,
    secretsManager: EnvvalVsCodeSecrets,
    promptIgnoreStore: PromptIgnoreStore,
    logger: Logger,
  ) {
    this.context = context;
    this.metadataStore = metadataStore;
    this.apiClient = apiClient;
    this.secretsManager = secretsManager;
    this.promptIgnoreStore = promptIgnoreStore;
    this.logger = logger;
  }

  public static getInstance(
    context: vscode.ExtensionContext,
    metadataStore: EnvvalMetadataStore,
    apiClient: EnvvalApiClient,
    secretsManager: EnvvalVsCodeSecrets,
    promptIgnoreStore: PromptIgnoreStore,
    logger: Logger,
  ): EnvInitService {
    if (!EnvInitService.instance) {
      EnvInitService.instance = new EnvInitService(
        context,
        metadataStore,
        apiClient,
        secretsManager,
        promptIgnoreStore,
        logger,
      );
    }
    return EnvInitService.instance;
  }

  private async getEncryptionKey(): Promise<string | null> {
    const keyMaterial = await this.secretsManager.getKeyMaterial();
    const userId = await this.secretsManager.getUserId();
    if (!keyMaterial || !userId) {
      this.logger.error(
        "Missing key material or user ID — cannot encrypt/decrypt",
      );
      return null;
    }
    return deriveKeyAsync(keyMaterial, userId);
  }

  /**
   * Orchestrates the primary startup check.
   * @param depth - Internal recursion guard. Max 1 re-entry after a successful migration.
   */
  async performInitialCheck(depth = 0, force = false): Promise<void> {
    StatusBar.getInstance().setLoading(true, "Validating workspace...");
    try {
      const ctx = await this.resolveWorkspaceContext();
      if (!ctx) return;

      const { workspacePath, workspace, identityStore, migrationService } = ctx;

      if (workspace.requiresMigration && workspace.suggestedMigration) {
        const migrated =
          await migrationService.handleAutomaticMigrationPrompt(workspacePath);
        if (migrated) {
          // Re-run once so downstream steps see the new repoId.
          // depth guard prevents an infinite loop if migration keeps reporting success.
          if (depth < 1) {
            return this.performInitialCheck(depth + 1, force);
          }
          this.logger.warn(
            "performInitialCheck: migration re-entry limit reached, continuing",
          );
        }
      }

      await identityStore.updateLastActiveRepoId(workspacePath, workspace.repoId);

      const registered = await this.ensureRepoRegistered(
        workspace.repoId,
        workspace,
        workspacePath,
        force,
      );
      if (!registered) return;

      await this.syncRepoEnvs(workspace.repoId, workspacePath);

      // Secondary pass: catch any Git-remote changes that surfaced during sync
      await migrationService.handleAutomaticMigrationPrompt(workspacePath);
    } catch (error: unknown) {
      this.logger.error(`Initial check failed: ${formatError(error)}`);
    } finally {
      StatusBar.getInstance().setLoading(false);
    }
  }

  private async resolveWorkspaceContext(): Promise<
    | {
        workspacePath: string;
        workspace: WorkspaceIdentity;
        identityStore: RepoIdentityStore;
        migrationService: RepoMigrationService;
      }
    | undefined
  > {
    this.logger.info("Performing initial check for repo and env files");

    const wsContext =
      WorkspaceContextProvider.getInstance().getWorkspaceContext();
    if (wsContext.mode === "none" || !wsContext.primaryPath) {
      this.logger.warn("No workspace or file open");
      return undefined;
    }

    const workspacePath = wsContext.primaryPath;
    const validator = WorkspaceValidator.getInstance(this.logger);
    if (!(await validator.validateAndPromptIfNeeded(workspacePath))) {
      this.logger.info("Workspace validation failed or user cancelled");
      return undefined;
    }

    StatusBar.getInstance().updateState("Loading", "Scanning workspace...");

    const workspace = await getCurrentWorkspaceId(this.context, this.logger);
    if (!workspace) {
      this.logger.error("Failed to get workspace identity");
      return undefined;
    }

    const identityStore = RepoIdentityStore.getInstance(this.context);
    const migrationService = new RepoMigrationService(
      this.context,
      this.metadataStore,
      identityStore,
      this.apiClient,
      this.logger,
    );

    return { workspacePath, workspace, identityStore, migrationService };
  }

  private async ensureRepoRegistered(
    repoId: string,
    workspace: WorkspaceIdentity,
    workspacePath: string,
    force: boolean,
  ): Promise<boolean> {
    const repoExistsResponse = await this.apiClient.checkRepoExists(repoId);
    if (repoExistsResponse.exists) {
      return true;
    }

    const skippedRepos =
      this.context.workspaceState.get<Record<string, boolean>>(
        REPO_REGISTRATION_SKIPPED_KEY,
      ) ?? {};
    if (!force && skippedRepos[repoId]) {
      this.logger.info(
        "User previously declined repo registration for this workspace — skipping",
      );
      return false;
    }

    const shouldRegister = await showRepoRegistrationPrompt();
    if (shouldRegister !== "register") {
      await this.context.workspaceState.update(REPO_REGISTRATION_SKIPPED_KEY, {
        ...skippedRepos,
        [repoId]: true,
      });
      this.logger.info("User declined repo registration, skipping initial sync");
      return false;
    }

    const nameResult = await showRepoNamePrompt(workspacePath);
    if (nameResult.action === "skip" || !nameResult.name) {
      this.logger.info("User skipped repo name input, cancelling registration");
      return false;
    }

    try {
      await this.apiClient.createRepo({
        repoId,
        name: nameResult.name,
        workspacePath,
        gitRemoteUrl: workspace.gitRemoteUrl,
      });
      this.logger.info(`Repo registered: ${repoId} — "${nameResult.name}"`);
      const currentSkipped =
        this.context.workspaceState.get<Record<string, boolean>>(
          REPO_REGISTRATION_SKIPPED_KEY,
        ) ?? {};
      delete currentSkipped[repoId];
      await this.context.workspaceState.update(
        REPO_REGISTRATION_SKIPPED_KEY,
        currentSkipped,
      );
      showSuccess(`Project "${nameResult.name}" registered successfully.`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to register repo: ${formatError(error)}`);
      showError("Failed to register repository. Please try again.");
      return false;
    }
  }

  /**
   * Reconciles all local environment files with those on the server for a specific repo.
   */
  async syncRepoEnvs(repoId: string, workspacePath: string): Promise<void> {
    const localEnvFilePaths = await getAllEnvFiles(this.logger);
    this.logger.info(`Found ${localEnvFilePaths.length} local env files`);

    let remoteEnvs: readonly Env[] = [];
    try {
      remoteEnvs = await this.apiClient.getEnvs(repoId);
      this.logger.info(`Found ${remoteEnvs.length} remote env files`);
    } catch (error) {
      this.logger.error(`Failed to fetch remote envs: ${formatError(error)}`);
    }

    const remoteEnvMap = new Map(remoteEnvs.map((e) => [e.fileName, e]));

    const localEnvMap = new Map<string, string>();
    for (const relativePath of localEnvFilePaths) {
      localEnvMap.set(
        relativePath.replace(/\\/g, "/"),
        path.join(workspacePath, relativePath),
      );
    }

    const allEnvFiles = new Set([
      ...localEnvMap.keys(),
      ...remoteEnvMap.keys(),
    ]);
    this.logger.info(`${allEnvFiles.size} environment files to reconcile`);

    let processed = 0;
    let errors = 0;

    for (const fileName of allEnvFiles) {
      try {
        const localPath = localEnvMap.get(fileName);
        const remoteEnv = remoteEnvMap.get(fileName);
        const uri = localPath
          ? Uri.file(localPath)
          : Uri.file(path.join(workspacePath, fileName));

        const result = await getRepoAndEnvIds(fileName, this.context);
        const envId = result?.envId;
        if (!envId) {
          this.logger.warn(
            `Skipping ${fileName}: unable to determine environment ID`,
          );
          continue;
        }

        const existingMeta =
          (await this.metadataStore.loadEnvMetadata(envId)) ??
          (await this.metadataStore.loadEnvMetadataByFileName(fileName));
        const localExists = !!localPath && fs.existsSync(localPath);
        const remoteExists = !!remoteEnv;

        this.logger.info(
          `Reconciling ${fileName} [L:${localExists} R:${remoteExists} B:${!!existingMeta}]`,
        );

        await this.reconcileEnvFile({
          uri,
          repoId,
          envId,
          fileName,
          existingMeta: existingMeta ?? undefined,
          localExists,
          remoteExists,
          remoteEnv,
        });

        processed++;
      } catch (error) {
        this.logger.error(
          `Failed to reconcile ${fileName}: ${formatError(error)}`,
        );
        errors++;
      }
    }

    this.logger.info(
      `Reconciliation complete: ${processed} processed, ${errors} errors`,
    );
  }

  private async reconcileEnvFile(opts: {
    uri: Uri;
    repoId: string;
    envId: string;
    fileName: string;
    existingMeta: EnvMetadata | undefined;
    localExists: boolean;
    remoteExists: boolean;
    remoteEnv?: Env;
  }): Promise<void> {
    const {
      uri,
      repoId,
      envId,
      fileName,
      existingMeta,
      localExists,
      remoteExists,
      remoteEnv,
    } = opts;

    if (existingMeta) {
      if (remoteExists && localExists) {
        // Migrate metadata to server's env id if we stored under a different (computed) id.
        // Otherwise every save PUTs to the wrong id → 404.
        if (remoteEnv && existingMeta.envId !== remoteEnv.id) {
          await this.metadataStore.clearMetadata(existingMeta.envId);
          await this.metadataStore.saveEnvMetadataSync(
            remoteEnv.id,
            fileName,
            existingMeta.lastSyncedHash,
            existingMeta.envCount,
          );
          this.logger.debug(
            `Migrated metadata for ${fileName} to server env id`,
          );
        }
        return;
      }
      if (!remoteExists && localExists) {
        const isIgnored = await this.promptIgnoreStore.isIgnoredWithinInterval(
          repoId,
          fileName,
          IGNORE_INTERVAL_MS,
        );
        if (isIgnored) {
          return;
        }

        const choice = await showZombiePrompt(fileName);
        if (choice === "reinitialize") {
          await this.promptAndInitialize(uri, repoId, fileName);
          await this.promptIgnoreStore.clearIgnored(repoId, fileName);
        } else if (choice === "deleteLocal") {
          fs.unlinkSync(uri.fsPath);
          await this.metadataStore.clearMetadata(envId);
          await this.promptIgnoreStore.clearIgnored(repoId, fileName);
          showSuccess(`${fileName} deleted locally.`);
        } else if (choice === "skip") {
          await this.promptIgnoreStore.markIgnored(repoId, fileName);
        }
      } else if (remoteExists && !localExists) {
        await this.promptAndRestore(uri, envId, fileName, remoteEnv);
      } else {
        // !remoteExists && !localExists — stale metadata, clean it up
        await this.metadataStore.clearMetadata(envId);
      }
    } else {
      if (remoteExists && !localExists) {
        await this.promptAndRestore(uri, envId, fileName, remoteEnv);
      } else if (!remoteExists && localExists) {
        await this.promptAndInitialize(uri, repoId, fileName);
      } else if (remoteExists && localExists) {
        await this.handleFirstTimeSync(uri, envId, fileName, remoteEnv);
      }
    }
  }

  async maybeInitializeOrRestore(uri: Uri): Promise<void> {
    const fileName = toWorkspaceRelativePath(uri);
    const result = await getRepoAndEnvIds(fileName, this.context);
    if (!result) {
      this.logger.error(`Failed to get repo/env IDs for ${uri.fsPath}`);
      return;
    }

    const { repoId, envId, workspacePath, gitRemote } = result;

    const pathCheck = validateFilePath(uri.fsPath, workspacePath);
    if (!pathCheck.isValid) {
      this.logger.error(
        `Path validation failed for ${uri.fsPath}: ${pathCheck.error}`,
      );
      return;
    }

    // Honour the workspace-level registration skip: if the user declined during startup,
    // suppress all automatic prompts from file events. Only the Initialize button
    // (which calls performInitialCheck with force=true) should re-open the flow.
    const skippedRepos =
      this.context.workspaceState.get<Record<string, boolean>>(
        REPO_REGISTRATION_SKIPPED_KEY,
      ) ?? {};
    if (skippedRepos[repoId]) {
      this.logger.debug(
        `Skipping auto-prompt for ${fileName} — workspace registration previously declined`,
      );
      return;
    }

    const repoExistsResponse = await this.apiClient.checkRepoExists(repoId);
    if (!repoExistsResponse.exists) {
      const nameResult = await showRepoNamePrompt(workspacePath);
      if (nameResult.action === "skip" || !nameResult.name) {
        this.logger.info(
          "User skipped repo name input, cancelling registration",
        );
        return;
      }
      try {
        await this.apiClient.createRepo({
          repoId,
          name: nameResult.name,
          workspacePath,
          gitRemoteUrl: gitRemote,
        });
        this.logger.info(`Repo registered: ${repoId} — "${nameResult.name}"`);
        showSuccess(`Project "${nameResult.name}" registered successfully.`);
      } catch (error) {
        this.logger.error(`Failed to register repo: ${formatError(error)}`);
        return;
      }
    }

    // Short-circuit: if metadata already exists the file is already tracked
    const metaByEnvId = await this.metadataStore.loadEnvMetadata(envId);
    const metaByFile =
      await this.metadataStore.loadEnvMetadataByFileName(fileName);
    if (metaByEnvId ?? metaByFile) {
      return;
    }

    let remoteEnv: Env | undefined;
    try {
      const remoteEnvs = await this.apiClient.getEnvs(repoId);
      remoteEnv = remoteEnvs.find((e) => e.fileName === fileName);
    } catch (error) {
      this.logger.error(`Failed to check remote envs: ${formatError(error)}`);
    }

    const localExists = fs.existsSync(uri.fsPath);
    const remoteExists = !!remoteEnv;

    if (remoteExists && !localExists) {
      await this.promptAndRestore(uri, envId, fileName, remoteEnv);
    } else if (!remoteExists && localExists) {
      await this.promptAndInitialize(uri, repoId, fileName);
    } else if (remoteExists && localExists) {
      await this.handleFirstTimeSync(uri, envId, fileName, remoteEnv);
    }
  }

  private async promptAndInitialize(
    uri: Uri,
    repoId: string,
    fileName: string,
  ): Promise<void> {
    const isIgnored = await this.promptIgnoreStore.isIgnoredWithinInterval(
      repoId,
      fileName,
      IGNORE_INTERVAL_MS,
    );
    if (isIgnored) {
      return;
    }

    const answer = await showInitPrompt(fileName);
    if (answer !== "initialize") {
      await this.promptIgnoreStore.markIgnored(repoId, fileName);
      return;
    }

    try {
      const stat = fs.statSync(uri.fsPath);
      if (stat.size > MAX_ENV_FILE_SIZE_BYTES) {
        showError(
          `${fileName} is too large to sync (${Math.round(stat.size / 1024)}KB, max ${MAX_ENV_FILE_SIZE_BYTES / 1000}KB)`,
        );
        return;
      }

      const content = fs.readFileSync(uri.fsPath, "utf8");
      if (
        !content.trim() &&
        (await showEmptyFileConfirmation(fileName)) !== "yes"
      ) {
        return;
      }

      const key = await this.getEncryptionKey();
      if (!key) {
        return;
      }

      const hash = hashEnv(content);
      const envCount = countEnvVars(content);
      const { ciphertext, iv } = encryptEnv(content, key, this.logger);

      const env = await this.apiClient.createEnv({
        repoId,
        fileName,
        content: `${ciphertext}:${iv}`,
        latestHash: hash,
        envCount,
      });

      await this.metadataStore.saveEnvMetadataSync(
        env.id,
        fileName,
        hash,
        envCount,
      );
      await this.promptIgnoreStore.clearIgnored(repoId, fileName);
      showSuccess(`${fileName} is now backed up and synced.`);
    } catch (error) {
      this.logger.error(
        `Failed to initialize ${fileName}: ${formatError(error)}`,
      );
      showError(`Failed to initialize ${fileName}.`);
    }
  }

  private async promptAndRestore(
    uri: Uri,
    envId: string,
    fileName: string,
    remoteEnv?: Env,
  ): Promise<void> {
    if ((await showRestorePrompt(fileName)) !== "restore") {
      return;
    }

    try {
      if (!remoteEnv?.content) {
        remoteEnv = await this.apiClient.getEnv(envId);
        if (!remoteEnv) {
          showError(`Failed to fetch remote ${fileName}`);
          return;
        }
      }
      if (!remoteEnv?.content) {
        this.logger.error(`No content from server for ${fileName}`);
        showError(`Failed to restore ${fileName}: no content from server.`);
        return;
      }

      const key = await this.getEncryptionKey();
      if (!key) {
        return;
      }

      const [ciphertext, iv] = remoteEnv.content.split(":");
      if (!ciphertext || !iv) {
        this.logger.error(`Invalid remote content format for ${fileName}`);
        showError(`Failed to restore ${fileName}: invalid remote data.`);
        return;
      }

      const decrypted = decryptEnv(ciphertext, iv, key);
      const hash = hashEnv(decrypted);
      const envCount = countEnvVars(decrypted);

      fs.writeFileSync(uri.fsPath, decrypted, "utf8");
      await this.metadataStore.saveEnvMetadataSync(
        remoteEnv.id,
        fileName,
        hash,
        envCount,
      );
      showSuccess(`${fileName} restored successfully.`);
    } catch (error) {
      this.logger.error(`Failed to restore ${fileName}: ${formatError(error)}`);
      showError(`Failed to restore ${fileName}.`);
    }
  }

  private async handleFirstTimeSync(
    uri: Uri,
    envId: string,
    fileName: string,
    remoteEnv?: Env,
  ): Promise<void> {
    try {
      const stat = fs.statSync(uri.fsPath);
      if (stat.size > MAX_ENV_FILE_SIZE_BYTES) {
        showError(
          `${fileName} is too large to sync (${Math.round(stat.size / 1024)}KB, max ${MAX_ENV_FILE_SIZE_BYTES / 1000}KB)`,
        );
        return;
      }

      const localContent = fs.readFileSync(uri.fsPath, "utf8");
      const localHash = hashEnv(localContent);

      if (!remoteEnv?.content) {
        remoteEnv = await this.apiClient.getEnv(envId);
        if (!remoteEnv) {
          return;
        }
      }
      if (!remoteEnv?.content) {
        this.logger.error(`No content from server for ${fileName}`);
        return;
      }

      const key = await this.getEncryptionKey();
      if (!key) {
        return;
      }

      const [ciphertext, iv] = remoteEnv.content.split(":");
      if (!ciphertext || !iv) {
        return;
      }

      const effectiveEnvId = remoteEnv.id;
      const remoteContent = decryptEnv(ciphertext, iv, key);
      const remoteHash = hashEnv(remoteContent);

      if (localHash === remoteHash) {
        const envCount = countEnvVars(localContent);
        await this.metadataStore.saveEnvMetadataSync(
          effectiveEnvId,
          fileName,
          localHash,
          envCount,
        );
        showSuccess(`${fileName} is already in sync.`);
        return;
      }

      const localEmpty = !localContent.trim();
      const remoteEmpty = !remoteContent.trim();

      // Unambiguous cases: one side is empty — resolve without prompting
      if (localEmpty && !remoteEmpty) {
        fs.writeFileSync(uri.fsPath, remoteContent, "utf8");
        await this.metadataStore.saveEnvMetadataSync(
          effectiveEnvId,
          fileName,
          remoteHash,
          countEnvVars(remoteContent),
        );
        showSuccess(`${fileName} restored from remote.`);
        return;
      }

      if (!localEmpty && remoteEmpty) {
        const { ciphertext: c, iv: v } = encryptEnv(localContent, key);
        const envCount = countEnvVars(localContent);
        await this.apiClient.updateEnv(effectiveEnvId, {
          baseHash: remoteHash,
          content: `${c}:${v}`,
          latestHash: localHash,
          envCount,
        });
        await this.metadataStore.saveEnvMetadataSync(
          effectiveEnvId,
          fileName,
          localHash,
          envCount,
        );
        showSuccess(`${fileName} pushed to remote.`);
        return;
      }

      // Both sides differ and non-empty — ask the user
      const choice = await showFirstTimeSyncPrompt(fileName);
      if (choice === "useLocal") {
        const { ciphertext: c, iv: v } = encryptEnv(localContent, key);
        const envCount = countEnvVars(localContent);
        await this.apiClient.updateEnv(effectiveEnvId, {
          baseHash: remoteHash,
          content: `${c}:${v}`,
          latestHash: localHash,
          envCount,
        });
        await this.metadataStore.saveEnvMetadataSync(
          effectiveEnvId,
          fileName,
          localHash,
          envCount,
        );
        showSuccess(`Conflict resolved using local ${fileName}.`);
      } else if (choice === "useRemote") {
        fs.writeFileSync(uri.fsPath, remoteContent, "utf8");
        await this.metadataStore.saveEnvMetadataSync(
          effectiveEnvId,
          fileName,
          remoteHash,
          countEnvVars(remoteContent),
        );
        showSuccess(`Conflict resolved using remote ${fileName}.`);
      }
    } catch (error) {
      this.logger.error(
        `First-time sync failed for ${fileName}: ${formatError(error)}`,
      );
    }
  }
}
