import path from "path";
import fs from "fs";
import * as vscode from "vscode";
import { Uri } from "vscode";
import { getRepoAndEnvIds, getAllEnvFiles, getCurrentWorkspaceId, getWorkspacePath } from "../utils/repo-detection";
import type { Env } from "../api/types";
import { EnvVaultMetadataStore } from "./metadata-store";
import { RepoMigrationService } from "./repo-migration";
import { RepoIdentityStore } from "./repo-identity-store";
import { EnvVaultApiClient } from "../api/client";
import { EnvVaultVsCodeSecrets } from "../utils/secrets";
import { hashEnv, encryptEnv, decryptEnv, deriveKeyAsync, countEnvVars } from "../utils/crypto";
import { StatusBar } from "../ui/status-bar";
import { Logger } from "../utils/logger";
import { IGNORE_INTERVAL_MS } from "../lib/constants";
import { 
  showInitPrompt, 
  showRestorePrompt, 
  showFirstTimeSyncPrompt,
  showZombiePrompt,
  showRepoRegistrationPrompt,
  showEmptyFileConfirmation,
  showSuccess,
  showError
} from "../ui/dialog/init-prompt";

/**
 * Service responsible for the initial discovery and synchronization of environment files.
 * It handles the "first-run" scenarios when a workspace is opened or when a new environment 
 * file is created locally or discovered on the server.
 */
export class EnvInitService {
  private static instance: EnvInitService;
  private readonly context: vscode.ExtensionContext;
  private readonly metadataStore: EnvVaultMetadataStore;
  private readonly apiClient: EnvVaultApiClient;
  private readonly secretsManager: EnvVaultVsCodeSecrets;
  private readonly logger: Logger;

  private constructor(
    context: vscode.ExtensionContext,
    metadataStore: EnvVaultMetadataStore,
    apiClient: EnvVaultApiClient,
    secretsManager: EnvVaultVsCodeSecrets,
    logger: Logger
  ) {
    this.context = context;
    this.metadataStore = metadataStore;
    this.apiClient = apiClient;
    this.secretsManager = secretsManager;
    this.logger = logger;
  }

  public static getInstance(
    context: vscode.ExtensionContext,
    metadataStore: EnvVaultMetadataStore,
    apiClient: EnvVaultApiClient,
    secretsManager: EnvVaultVsCodeSecrets,
    logger: Logger
  ): EnvInitService {
    if (!EnvInitService.instance) {
      EnvInitService.instance = new EnvInitService(context, metadataStore, apiClient, secretsManager, logger);
    }
    return EnvInitService.instance;
  }

  private async getEncryptionKey(): Promise<string | null> {
    const keyMaterial = await this.secretsManager.getKeyMaterial();
    const userId = await this.secretsManager.getUserId();
    if (!keyMaterial || !userId) {
      this.logger.error("Missing key material or user ID - cannot perform encryption/decryption");
      return null;
    }
    return deriveKeyAsync(keyMaterial, userId);
  }

  /**
   * Orchestrates the primary startup check.
   */
  async performInitialCheck(): Promise<void> {
    StatusBar.getInstance().setLoading(true, "Scanning workspace...");
    try {
      this.logger.info("Performing initial check for repo and env files");
      
      const workspace = await getCurrentWorkspaceId(undefined, this.context, this.logger);
      if (!workspace) {
        this.logger.error("Failed to get workspace identity");
        return;
      }
      
      const { repoId, workspacePath } = workspace;

      // Check for migration opportunities
      if (workspace.requiresMigration && workspace.suggestedMigration) {
        const identityStore = new RepoIdentityStore(this.context);
        const migrationService = new RepoMigrationService(
          this.context,
          this.metadataStore,
          identityStore,
          this.apiClient,
          this.logger
        );
        
        const migrated = await migrationService.handleAutomaticMigrationPrompt(workspacePath);
        if (migrated) {
          return this.performInitialCheck();
        }
      }

      // Update last active repo ID
      const identityStore = new RepoIdentityStore(this.context);
      await identityStore.updateLastActiveRepoId(workspacePath, repoId);

      // Check if repo exists on server
      const repoExistsResponse = await this.apiClient.checkRepoExists(repoId);
      
      if (!repoExistsResponse.exists) {
        const shouldRegister = await showRepoRegistrationPrompt();
        if (shouldRegister === "register") {
          try {
            await this.apiClient.createRepo({ 
              repoId, 
              workspacePath, 
              gitRemoteUrl: workspace.gitRemoteUrl 
            });
            this.logger.info(`Repo registered: ${repoId}`);
          } catch (error) {
            this.logger.error(`Failed to register repo: ${error instanceof Error ? error.message : String(error)}`);
            showError("Failed to register repository. Please try again.");
            return;
          }
        } else {
          this.logger.info("User declined repo registration, skipping initial sync");
          return;
        }
      }

      // Sync all env files for this repo
      await this.syncRepoEnvs(repoId, workspacePath);
      
      // Secondary check for other migrations (e.g. Git Remote changes)
      const migrationManager = new RepoMigrationService(
        this.context,
        this.metadataStore,
        identityStore,
        this.apiClient,
        this.logger
      );
      await migrationManager.handleAutomaticMigrationPrompt(workspacePath);
      
    } catch (error: unknown) {
      this.logger.error(`Initial check failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      StatusBar.getInstance().setLoading(false);
    }
  }

  /**
   * Reconciles all local environment files with those on the server for a specific repo.
   */
  async syncRepoEnvs(repoId: string, workspacePath: string): Promise<void> {
    const localEnvFilePaths = await getAllEnvFiles();
    this.logger.info(`Found ${localEnvFilePaths.length} local env files`);

    let remoteEnvs : readonly Env [] = [];
    try {
      remoteEnvs = await this.apiClient.getEnvs(repoId);
      this.logger.info(`Found ${remoteEnvs.length} remote env files`);
    } catch (error) {
      this.logger.error(`Failed to fetch remote envs: ${(error as Error).message}`);
    }

    const remoteEnvMap = new Map<string, Env>();
    for (const env of remoteEnvs) {
      remoteEnvMap.set(env.fileName, env);
    }

    const localEnvMap = new Map<string, string>();
    for (const relativePath of localEnvFilePaths) {
      const fileName = path.basename(relativePath);
      const fullPath = path.join(workspacePath, relativePath);
      localEnvMap.set(fileName, fullPath);
    }

    const allEnvFiles = new Set([...localEnvMap.keys(), ...remoteEnvMap.keys()]);
    this.logger.info(`Found ${allEnvFiles.size} environment files to reconcile`);
    
    const errors: Array<{ fileName: string; error: string }> = [];
    let processed = 0;
    
    for (const fileName of allEnvFiles) {
      try {
        const localPath = localEnvMap.get(fileName);
        const remoteEnv = remoteEnvMap.get(fileName);
        const uri = localPath ? Uri.file(localPath) : Uri.file(path.join(workspacePath, fileName));
        
        const result = await getRepoAndEnvIds(fileName, undefined, this.context);
        const envId = result?.envId;
       
        if (!envId) {
          this.logger.warn(`Skipping ${fileName}: Unable to determine environment ID`);
          continue;
        }

        const existingMeta = await this.metadataStore.loadEnvMetadata(envId);
        const localExists = !!localPath && fs.existsSync(localPath);
        const remoteExists = !!remoteEnv;

        this.logger.info(`Reconciling ${fileName} [L:${localExists}, R:${remoteExists}, B:${!!existingMeta}]`);

        if (existingMeta) {
          if (remoteExists && localExists) {
            continue; 
          } 
          
          if (!remoteExists && localExists) {
            if (existingMeta.ignoredAt) {
              const ignoredTime = new Date(existingMeta.ignoredAt).getTime();
              if (Date.now() - ignoredTime < IGNORE_INTERVAL_MS) {
                continue;
              }
            }

            const choice = await showZombiePrompt(fileName);
            if (choice === 'reinitialize') {
              await this.promptAndInitialize(uri, repoId, envId, fileName);
            } else if (choice === 'deleteLocal') {
              fs.unlinkSync(uri.fsPath);
              await this.metadataStore.clearMetadata(envId);
              showSuccess(`${fileName} deleted locally.`);
            } else if (choice === 'skip') {
              await this.metadataStore.markAsIgnored(envId);
            }
          } else if (remoteExists && !localExists) {
            await this.promptAndRestore(uri, repoId, envId, fileName, remoteEnv);
          } else if (!remoteExists && !localExists) {
            await this.metadataStore.clearMetadata(envId);
          }
        } else {
          if (remoteExists && !localExists) {
            await this.promptAndRestore(uri, repoId, envId, fileName, remoteEnv);
          } else if (!remoteExists && localExists) {
            await this.promptAndInitialize(uri, repoId, envId, fileName);
          } else if (remoteExists && localExists) {
            await this.handleFirstTimeSync(uri, repoId, envId, fileName, remoteEnv);
          }
        }
        
        processed++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.logger.error(`Failed to reconcile ${fileName}: ${errorMessage}`);
        errors.push({ fileName, error: errorMessage });
      }
    }
    
    this.logger.info(`Reconciliation complete: ${processed} processed, ${errors.length} errors`);
  }

  async maybeInitializeOrRestore(uri: Uri): Promise<void> {
    const result = await getRepoAndEnvIds(path.basename(uri.fsPath), undefined, this.context);
    if (!result) {
      this.logger.error(`Failed to get repo and env ids for ${uri.fsPath}`);
      return;
    }
      
    const { repoId, envId, workspacePath, gitRemote } = result;

    const repoExistsResponse = await this.apiClient.checkRepoExists(repoId);
    if (!repoExistsResponse.exists) {
      try {
        await this.apiClient.createRepo({ 
          repoId, 
          workspacePath, 
          gitRemoteUrl: gitRemote 
        });
        this.logger.info(`Auto-registered repo: ${repoId}`);
      } catch (error) {
        this.logger.error(`Failed to register repo: ${(error as Error).message}`);
        return;
      }
    }

    const existingMeta = await this.metadataStore.loadEnvMetadata(envId);
    if (existingMeta) {
      return;
    }

    const fileName = path.basename(uri.fsPath);
    let remoteEnv: Env | undefined;
    try {
      const remoteEnvs = await this.apiClient.getEnvs(repoId);
      remoteEnv = remoteEnvs.find(e => e.fileName === fileName);
    } catch (error) {
      this.logger.error(`Failed to check remote envs: ${(error as Error).message}`);
    }

    const localExists = fs.existsSync(uri.fsPath);
    const remoteExists = !!remoteEnv;

    if (remoteExists && !localExists) {
      await this.promptAndRestore(uri, repoId, envId, fileName, remoteEnv);
    } else if (!remoteExists && localExists) {
      await this.promptAndInitialize(uri, repoId, envId, fileName);
    } else if (remoteExists && localExists) {
      await this.handleFirstTimeSync(uri, repoId, envId, fileName, remoteEnv);
    }
  }

  private async promptAndInitialize(uri: Uri, repoId: string, envId: string, fileName: string): Promise<void> {
    const answer = await showInitPrompt(fileName);
    if (answer === 'initialize') {
      try {
        const content = fs.readFileSync(uri.fsPath, 'utf8');
        if (!content.trim()) {
          const confirmEmpty = await showEmptyFileConfirmation(fileName);
          if (confirmEmpty !== 'yes') return;
        }

        const key = await this.getEncryptionKey();
        if (!key) return;

        const hash = hashEnv(content);
        const envCount = countEnvVars(content);
        const { ciphertext, iv } = encryptEnv(content, key, this.logger);

        const env = await this.apiClient.createEnv({
          repoId,
          fileName,
          content: `${ciphertext}:${iv}`,
          latestHash: hash,
          envCount
        });

        await this.metadataStore.saveEnvMetadataSync(env.id, fileName, hash, envCount);
        showSuccess(`${fileName} is now backed up and synced.`);
      } catch (error) {
        this.logger.error(`Failed to initialize ${fileName}: ${(error as Error).message}`);
        showError(`Failed to initialize ${fileName}.`);
      }
    }
  }

  private async promptAndRestore(uri: Uri, repoId: string, envId: string, fileName: string, remoteEnv?: Env): Promise<void> {
    const answer = await showRestorePrompt(fileName);
    if (answer === 'restore') {
      try {
        if (!remoteEnv) {
          remoteEnv = await this.apiClient.getEnv(envId);
          if (!remoteEnv) {
            showError(`Failed to fetch remote ${fileName}`);
            return;
          }
        }

        const key = await this.getEncryptionKey();
        if (!key) return;
        
        const [ciphertext, iv] = remoteEnv.content.split(':');
        const decrypted = decryptEnv(ciphertext, iv, key);
        const hash = hashEnv(decrypted);
        const envCount = countEnvVars(decrypted);

        fs.writeFileSync(uri.fsPath, decrypted, 'utf8');
        await this.metadataStore.saveEnvMetadataSync(envId, fileName, hash, envCount);
        showSuccess(`${fileName} restored successfully.`);
      } catch (error) {
        this.logger.error(`Failed to restore ${fileName}: ${(error as Error).message}`);
        showError(`Failed to restore ${fileName}.`);
      }
    }
  }

  private async handleFirstTimeSync(uri: Uri, repoId: string, envId: string, fileName: string, remoteEnv?: Env): Promise<void> {
    try {
      const localContent = fs.readFileSync(uri.fsPath, 'utf8');
      const localHash = hashEnv(localContent);

      if (!remoteEnv || !remoteEnv.content) {
        remoteEnv = await this.apiClient.getEnv(envId);
        if (!remoteEnv) return;
      }

      const key = await this.getEncryptionKey();
      if (!key) return;
      
      const [ciphertext, iv] = remoteEnv.content.split(':');
      if (!ciphertext || !iv) return;

      const remoteContent = decryptEnv(ciphertext, iv, key);
      const remoteHash = hashEnv(remoteContent);
     
      if (localHash === remoteHash) {
        const envCount = countEnvVars(localContent);
        await this.metadataStore.saveEnvMetadataSync(envId, fileName, localHash, envCount);
        showSuccess(`${fileName} is already in sync.`);
        return;
      }

      const localEmpty = !localContent.trim();
      const remoteEmpty = !remoteContent.trim();

      if (localEmpty && !remoteEmpty) {
        fs.writeFileSync(uri.fsPath, remoteContent, 'utf8');
        const envCount = countEnvVars(remoteContent);
        await this.metadataStore.saveEnvMetadataSync(envId, fileName, remoteHash, envCount);
        showSuccess(`${fileName} restored from remote.`);
        return;
      } else if (!localEmpty && remoteEmpty) {
        const { ciphertext: newCiphertext, iv: newIv } = encryptEnv(localContent, key);
        const envCount = countEnvVars(localContent);
        await this.apiClient.updateEnv(envId, {
          content: `${newCiphertext}:${newIv}`,
          latestHash: localHash,
          envCount
        });
        await this.metadataStore.saveEnvMetadataSync(envId, fileName, localHash, envCount);
        showSuccess(`${fileName} pushed to remote.`);
        return;
      }

      const choice = await showFirstTimeSyncPrompt(fileName);
      if (choice === 'useLocal') {
        const { ciphertext: newCiphertext, iv: newIv } = encryptEnv(localContent, key);
        const envCount = countEnvVars(localContent);
        await this.apiClient.updateEnv(envId, {
          content: `${newCiphertext}:${newIv}`,
          latestHash: localHash,
          envCount
        });
        await this.metadataStore.saveEnvMetadataSync(envId, fileName, localHash, envCount);
        showSuccess(`Conflict resolved using local ${fileName}.`);
      } else if (choice === 'useRemote') {
        fs.writeFileSync(uri.fsPath, remoteContent, 'utf8');
        const envCount = countEnvVars(remoteContent);
        await this.metadataStore.saveEnvMetadataSync(envId, fileName, remoteHash, envCount);
        showSuccess(`Conflict resolved using remote ${fileName}.`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle first time sync for ${fileName}: ${(error as Error).message}`);
    }
  }
}