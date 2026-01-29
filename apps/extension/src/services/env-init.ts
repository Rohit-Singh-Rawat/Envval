import path from "path";
import fs from "fs";
import * as vscode from "vscode";
import { Uri } from "vscode";
import { getRepoAndEnvIds, getAllEnvFiles, getWorkspacePath, getCurrentWorkspaceId } from "../utils/repo-detection";
import type { Env } from "../api/types";
import { EnvVaultMetadataStore } from "./metadata-store";
import { RepoMigrationService } from "./repo-migration";
import { RepoIdentityStore } from "./repo-identity-store";
import { EnvVaultApiClient } from "../api/client";
import { EnvVaultVsCodeSecrets } from "../utils/secrets";
import { hashEnv, encryptEnv, decryptEnv, deriveKey } from "../utils/crypto";
import { Logger } from "../utils/logger";
import { 
  showInitPrompt, 
  showRestorePrompt, 
  showFirstTimeSyncPrompt,
  showRepoRegistrationPrompt,
  showEmptyFileConfirmation,
  showSuccess,
  showError
} from "../ui/dialog/init-prompt";

export class EnvInitService {
  private static instance: EnvInitService;
  private context: vscode.ExtensionContext;
  private metadataStore: EnvVaultMetadataStore;
  private apiClient: EnvVaultApiClient;
  private secretsManager: EnvVaultVsCodeSecrets;
  private logger: Logger;

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

  async performInitialCheck(): Promise<void> {
    this.logger.info("Performing initial check for repo and env files");
    // Get repoId for current workspace - now with context for full priority chain support
    const workspace = await getCurrentWorkspaceId(undefined, this.context, this.logger);
    if (!workspace) {
      this.logger.error("Failed to get workspace");
      return;
    }
    const { repoId, workspacePath } = workspace;
    
    this.logger.debug(`Workspace path: ${workspacePath}, repoId: ${repoId}, gitRemote: ${workspace.gitRemote}`);
    
    if (!repoId) {
      this.logger.error("Failed to get repo ID for workspace");
      return;
    }

    // Repo-first approach: Check if repo exists on server
    const repoExistsResponse = await this.apiClient.checkRepoExists(repoId);
    
    if (!repoExistsResponse.exists) {
      // Repo doesn't exist - prompt to register it
      this.logger.info(`Repo not registered: ${repoId}`);
      const shouldRegister = await showRepoRegistrationPrompt();

      if (shouldRegister === "register") {
        try {
          await this.apiClient.createRepo({ repoId });
          this.logger.info(`Repo registered: ${repoId}`);
        } catch (error) {
          this.logger.error(`Failed to register repo: ${(error as Error).message}`);
          showError("Failed to register repository. Please try again.");
          return;
        }
      } else {
        return; // User skipped repo registration
      }
    }

    // Now handle all env files for this repo
    await this.syncRepoEnvs(repoId, workspacePath);

    // Check for migration opportunities (e.g., Git remote added to content-signature-based project)
    if (workspace.requiresMigration && workspace.suggestedMigration) {
      this.logger.info(`Migration opportunity detected: ${workspace.suggestedMigration.reason}`);
      const identityStore = new RepoIdentityStore(this.context);
      const migrationService = new RepoMigrationService(
        this.context,
        this.metadataStore,
        identityStore,
        this.logger
      );
      await migrationService.handleAutomaticMigrationPrompt(workspacePath);
    }
  }

  async syncRepoEnvs(repoId: string, workspacePath: string): Promise<void> {
    // Get all local env files
    const localEnvFilePaths = await getAllEnvFiles();
    this.logger.info(`Found ${localEnvFilePaths.length} local env files`);

    // Get all remote envs for this repo
    let remoteEnvs: Env[] = [];
    try {
      remoteEnvs = await this.apiClient.getEnvs(repoId);
      this.logger.info(`Found ${remoteEnvs.length} remote env files`);
    } catch (error) {
      this.logger.error(`Failed to fetch remote envs: ${(error as Error).message}`);
    }

    // Create maps for easy lookup
    const remoteEnvMap = new Map<string, Env>();
    for (const env of remoteEnvs) {
      remoteEnvMap.set(env.fileName, env);
    }

    const localEnvMap = new Map<string, string>(); // fileName -> fullPath
    for (const relativePath of localEnvFilePaths) {
      const fileName = path.basename(relativePath);
      const fullPath = path.join(workspacePath, relativePath);
      localEnvMap.set(fileName, fullPath);
    }

    // Process each env file
    const allEnvFiles = new Set([...localEnvMap.keys(), ...remoteEnvMap.keys()]);

    for (const fileName of allEnvFiles) {
      const localPath = localEnvMap.get(fileName);
      const remoteEnv = remoteEnvMap.get(fileName);
      const uri = localPath ? Uri.file(localPath) : Uri.file(path.join(workspacePath, fileName));
      
      const { envId } = await getRepoAndEnvIds(fileName, undefined, this.context) ?? { repoId, envId: '' };
      if (!envId) {
        continue;
      }

      // Check if already tracked in metadata
      const existingMeta = await this.metadataStore.loadEnvMetadata(envId);
      if (existingMeta) {
        this.logger.info(`Env file already tracked: ${fileName}`);
        continue; // Already initialized, skip
      }

      // Handle different scenarios
      const localExists = !!localPath && fs.existsSync(localPath);
      const remoteExists = !!remoteEnv;

      if (remoteExists && !localExists) {
        // Remote exists, local doesn't - restore
        this.logger.info(`Remote env exists but local doesn't: ${fileName}`);
        await this.promptAndRestore(uri, repoId, envId, fileName, remoteEnv);
      } else if (!remoteExists && localExists) {
        // Local exists, remote doesn't - initialize
        this.logger.info(`New env file detected: ${fileName}`);
        await this.promptAndInitialize(uri, repoId, envId, fileName);
      } else if (remoteExists && localExists) {
        // Both exist - first-time sync
        this.logger.info(`Both local and remote exist for: ${fileName}`);
        await this.handleFirstTimeSync(uri, repoId, envId, fileName, remoteEnv);
      }
    }
  }

  async maybeInitializeOrRestore(uri: Uri): Promise<void> {
    // This method is called from SyncManager for new file events
    // Use the repo-first approach here too - with context for full priority chain support
    const result = await getRepoAndEnvIds(uri.fsPath, undefined, this.context);
    if (!result) {
      this.logger.error(`Failed to get repo and env ids for ${uri.fsPath}`);
      return;
    }
      
    const { repoId, envId } = result;

    // Check if repo exists first
    const repoExistsResponse = await this.apiClient.checkRepoExists(repoId);
    if (!repoExistsResponse.exists) {
      // Auto-register repo if it doesn't exist
      try {
        await this.apiClient.createRepo({ repoId });
        this.logger.info(`Auto-registered repo: ${repoId}`);
      } catch (error) {
        this.logger.error(`Failed to register repo: ${(error as Error).message}`);
        return;
      }
    }

    // Check if already tracked in metadata
    const existingMeta = await this.metadataStore.loadEnvMetadata(envId);
    if (existingMeta) {
      this.logger.info(`Env file already tracked: ${path.basename(uri.fsPath)}`);
      return;
    }

    // Check if remote env exists
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
      await this.promptAndRestore(uri, repoId, envId, fileName);
    } else if (!remoteExists && localExists) {
      await this.promptAndInitialize(uri, repoId, envId, fileName);
    } else if (remoteExists && localExists) {
      await this.handleFirstTimeSync(uri, repoId, envId, fileName);
    }
  }

  private async promptAndInitialize(uri: Uri, repoId: string, envId: string, fileName: string): Promise<void> {
    this.logger.info(`Prompting to initialize: ${uri.fsPath}`);
    
    const answer = await showInitPrompt(fileName);
    
    if (answer === 'initialize') {
      try {
        this.logger.info(`User chose to initialize ${fileName}`);
        
        // Read file content
        const content = fs.readFileSync(uri.fsPath, 'utf8');
        
        if (!content.trim()) {
          const confirmEmpty = await showEmptyFileConfirmation(fileName);
          if (confirmEmpty !== 'yes') {
            return;
          }
        }

        // Get encryption key
        const keyMaterial = await this.secretsManager.getKeyMaterial();
        const deviceId = await this.secretsManager.getDeviceId();
        if (!keyMaterial || !deviceId) {
          showError('Missing encryption keys. Please re-authenticate.');
          return;
        }

        const key = deriveKey(keyMaterial, deviceId);
        const hash = hashEnv(content);
        const { ciphertext, iv } = encryptEnv(content, key);

        // Create env on server
        await this.apiClient.createEnv({
          repoId,
          fileName,
          content: `${ciphertext}:${iv}` // Format: ciphertext:iv
        });

        // Save metadata
        await this.metadataStore.saveEnvMetadataSync(envId, fileName, hash);

        this.logger.info(`Successfully initialized ${fileName}`);
        showSuccess(`${fileName} is now backed up and synced.`);
      } catch (error) {
        this.logger.error(`Failed to initialize ${fileName}: ${(error as Error).message}`);
        showError(`Failed to initialize ${fileName}. Please try again.`);
      }
    } else {
      this.logger.info(`User declined to initialize ${fileName}`);
    }
  }

  private async promptAndRestore(uri: Uri, repoId: string, envId: string, fileName: string, remoteEnv?: Env): Promise<void> {
    this.logger.info(`Prompting to restore: ${uri.fsPath}`);
    
    const answer = await showRestorePrompt(fileName);
    
    if (answer === 'restore') {
      try {
        this.logger.info(`User chose to restore ${fileName}`);
        
        // Get remote env if not provided
        if (!remoteEnv) {
          remoteEnv = await this.apiClient.getEnv(envId);
          if (!remoteEnv) {
            showError(`Failed to fetch remote ${fileName}`);
            return;
          }
        }

        // Get encryption key
        const keyMaterial = await this.secretsManager.getKeyMaterial();
        const deviceId = await this.secretsManager.getDeviceId();
        if (!keyMaterial || !deviceId) {
          showError('Missing encryption keys. Please re-authenticate.');
          return;
        }

        const key = deriveKey(keyMaterial, deviceId);
        
        // Parse ciphertext and iv from content (format: ciphertext:iv)
        const [ciphertext, iv] = remoteEnv.content.split(':');
        const decrypted = decryptEnv(ciphertext, iv, key);
        const hash = hashEnv(decrypted);

        // Create local file
        fs.writeFileSync(uri.fsPath, decrypted, 'utf8');

        // Save metadata
        await this.metadataStore.saveEnvMetadataSync(envId, fileName, hash);

        this.logger.info(`Successfully restored ${fileName}`);
        showSuccess(`${fileName} restored successfully.`);
      } catch (error) {
        this.logger.error(`Failed to restore ${fileName}: ${(error as Error).message}`);
        showError(`Failed to restore ${fileName}. ${(error as Error).message}`);
      }
    } else {
      this.logger.info(`User declined to restore ${fileName}`);
    }
  }

  private async handleFirstTimeSync(uri: Uri, repoId: string, envId: string, fileName: string, remoteEnv?: Env): Promise<void> {
    this.logger.info(`Handling first time sync: ${uri.fsPath}`);
    
    try {
      // Read local file
      const localContent = fs.readFileSync(uri.fsPath, 'utf8');
      const localHash = hashEnv(localContent);

      // Get remote env if not provided
        if (!remoteEnv) {
          remoteEnv = await this.apiClient.getEnv(envId);
          if (!remoteEnv) {
            showError(`Failed to fetch remote ${fileName}`);
            return;
          }
        }

        // Get encryption key
        const keyMaterial = await this.secretsManager.getKeyMaterial();
        const deviceId = await this.secretsManager.getDeviceId();
        if (!keyMaterial || !deviceId) {
          showError('Missing encryption keys. Please re-authenticate.');
          return;
        }

      const key = deriveKey(keyMaterial, deviceId);
      
      // Decrypt remote content
      const [ciphertext, iv] = remoteEnv.content.split(':');
      const remoteContent = decryptEnv(ciphertext, iv, key);
      const remoteHash = hashEnv(remoteContent);

      // Compare hashes
      if (localHash === remoteHash) {
        // Same content, just mark as synced
        await this.metadataStore.saveEnvMetadataSync(envId, fileName, localHash);
        this.logger.info(`${fileName} is already in sync`);
        showSuccess(`${fileName} is already in sync.`);
        return;
      }

      // Check if one is empty
      const localEmpty = !localContent.trim();
      const remoteEmpty = !remoteContent.trim();

      if (localEmpty && !remoteEmpty) {
        // Local empty, use remote
        fs.writeFileSync(uri.fsPath, remoteContent, 'utf8');
        await this.metadataStore.saveEnvMetadataSync(envId, fileName, remoteHash);
        showSuccess(`${fileName} restored from remote.`);
        return;
      } else if (!localEmpty && remoteEmpty) {
        // Remote empty, push local
        const { ciphertext: newCiphertext, iv: newIv } = encryptEnv(localContent, key);
        await this.apiClient.updateEnv(envId, {
          content: `${newCiphertext}:${newIv}`
        });
        await this.metadataStore.saveEnvMetadataSync(envId, fileName, localHash);
        showSuccess(`${fileName} pushed to remote.`);
        return;
      }

      // Both have content and differ - conflict
      const choice = await showFirstTimeSyncPrompt(fileName);

      if (choice === 'useLocal') {
        // Push local to remote
        const { ciphertext: newCiphertext, iv: newIv } = encryptEnv(localContent, key);
        await this.apiClient.updateEnv(envId, {
          content: `${newCiphertext}:${newIv}`
        });
        await this.metadataStore.saveEnvMetadataSync(envId, fileName, localHash);
        showSuccess(`Conflict resolved using local ${fileName}.`);
      } else if (choice === 'useRemote') {
        // Pull remote to local
        fs.writeFileSync(uri.fsPath, remoteContent, 'utf8');
        await this.metadataStore.saveEnvMetadataSync(envId, fileName, remoteHash);
        showSuccess(`Conflict resolved using remote ${fileName}.`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle first time sync for ${fileName}: ${(error as Error).message}`);
      showError(`Failed to sync ${fileName}. ${(error as Error).message}`);
    }
  }
}