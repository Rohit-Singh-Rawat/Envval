import path from "path";
import fs from "fs";
import * as vscode from "vscode";
import { Uri } from "vscode";
import { getRepoAndEnvIds, getAllEnvFiles, getCurrentWorkspaceId } from "../utils/repo-detection";
import type { Env } from "../api/types";
import { EnvVaultMetadataStore } from "./metadata-store";
import { RepoMigrationService } from "./repo-migration";
import { RepoIdentityStore } from "./repo-identity-store";
import { EnvVaultApiClient } from "../api/client";
import { EnvVaultVsCodeSecrets } from "../utils/secrets";
import { hashEnv, encryptEnv, decryptEnv, deriveKeyAsync, countEnvVars } from "../utils/crypto";
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

  /**
   * Helper to retrieve and derive the encryption key.
   * Handles error reporting if keys are missing.
   */
  private async getEncryptionKey(): Promise<string | null> {
    const keyMaterial = await this.secretsManager.getKeyMaterial();
    const userId = await this.secretsManager.getUserId();
    
    if (!keyMaterial || !userId) {
      this.logger.error('Missing encryption keys');
      showError('Missing encryption keys. Please re-authenticate.');
      return null;
    }

    return deriveKeyAsync(keyMaterial, userId);
  }

  /**
   * Orchestrates the primary startup check.
   * Execution Flow:
   * 1. Detects repo identity for the current workspace.
   * 2. Verifies if the repository is registered in the cloud vault.
   * 3. Triggers bulk synchronization of all environment files.
   * 4. Checks if the repository should be migrated to a better identity (e.g., local -> git).
   * 
   * Used: Automatically during extension activation or manual workspace scan.
   */
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

    // Check for migration opportunities (e.g. Content -> Git, or Git Remote Change)
    if (workspace.requiresMigration && workspace.suggestedMigration) {
      this.logger.info(`Migration opportunity detected: ${workspace.suggestedMigration.reason}`);
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
        this.logger.info('Migration successful, restarting initial check with new identity');
        return this.performInitialCheck();
      }
    }

    // Update last active repo ID to track this as the current valid identity
    const identityStore = new RepoIdentityStore(this.context);
    await identityStore.updateLastActiveRepoId(workspacePath, repoId);

    // Repo-first approach: Check if repo exists on server
    const repoExistsResponse = await this.apiClient.checkRepoExists(repoId);
    
    if (!repoExistsResponse.exists) {
      // Repo doesn't exist - prompt to register it
      this.logger.info(`Repo not registered: ${repoId}`);
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


  }

  /**
   * Reconciles all local environment files with those on the server for a specific repo.
   * Identifies untracked local files, missing local files that exist on server, 
   * and potential conflicts.
   * 
   * Used: Internal helper for bulk synchronization during performInitialCheck.
   */
  async syncRepoEnvs(repoId: string, workspacePath: string): Promise<void> {
    // Get all local env files
    const localEnvFilePaths = await getAllEnvFiles();
    this.logger.info(`Found ${localEnvFilePaths.length} local env files`);

    // Get all remote envs for this repo
    let remoteEnvs : readonly Env [] = [];
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
    this.logger.info(`Found ${allEnvFiles.size} environment files to reconcile`);
    
    // Track reconciliation results for error reporting
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

        // 1. Load Metadata (Base State)
        const existingMeta = await this.metadataStore.loadEnvMetadata(envId);
        
        // 2. State Detection
        const localExists = !!localPath && fs.existsSync(localPath);
        const remoteExists = !!remoteEnv;

        this.logger.info(`Reconciling ${fileName} [L:${localExists}, R:${remoteExists}, B:${!!existingMeta}]`);

        // 3. Decision Matrix (Three-Way Reconciliation)
        if (existingMeta) {
          // --- BASE EXISTS (Already Tracked) ---
          if (remoteExists && localExists) {
            // HEALTHY: Both sides match metadata tracking.
            // Normal synchronization will be handled by SyncManager's polling or save events.
            continue; 
          } 
          
          if (!remoteExists && localExists) {
            // ZOMBIE: Remote copy was deleted. Local file and tracking metadata still exist.
            // Prompt user to re-push, delete local, or ignore (with cooldown).
            if (existingMeta.ignoredAt) {
              const ignoredTime = new Date(existingMeta.ignoredAt).getTime();
              if (Date.now() - ignoredTime < IGNORE_INTERVAL_MS) {
                this.logger.info(`Skipping zombie prompt for ${fileName} (ignored until tomorrow)`);
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
            // GHOST: Local file deleted, but remains on server.
            // Prompt to restore or stop tracking.
            await this.promptAndRestore(uri, repoId, envId, fileName, remoteEnv);
          } else if (!remoteExists && !localExists) {
            // DEAD: Both sides deleted. Clean up local tracking metadata.
            await this.metadataStore.clearMetadata(envId);
          }
        } else {
          // --- BASE MISSING (Unlinked) ---
          if (remoteExists && !localExists) {
            // NEW REMOTE: Discovered on server but not present locally.
            await this.promptAndRestore(uri, repoId, envId, fileName, remoteEnv);
          } else if (!remoteExists && localExists) {
            // NEW LOCAL: Created locally but not yet backed up to EnvVault.
            await this.promptAndInitialize(uri, repoId, envId, fileName);
          } else if (remoteExists && localExists) {
            // COLLISION: File exists on both sides but isn't linked via metadata.
            // Reconcile by comparing hashes and prompting user.
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
    
    // Report summary
    this.logger.info(`Reconciliation complete: ${processed} processed, ${errors.length} errors`);
    if (errors.length > 0) {
      const errorList = errors.map(e => `${e.fileName}: ${e.error}`).join('\n');
      this.logger.warn(`Reconciliation errors:\n${errorList}`);
    }
  }

  /**
   * Targeted synchronization for a single file.
   * Checks if a specific file needs to be initialized (backed up) or restored (pulled).
   * 
   * Used: By SyncManager when a new file is detected by the file watcher (onDidCreate).
   */
  async maybeInitializeOrRestore(uri: Uri): Promise<void> {
    // This method is called from SyncManager for new file events
    // Use the repo-first approach here too - with context for full priority chain support
    const result = await getRepoAndEnvIds(path.basename(uri.fsPath), undefined, this.context);
    if (!result) {
      this.logger.error(`Failed to get repo and env ids for ${uri.fsPath}`);
      return;
    }
      
    const { repoId, envId, workspacePath, gitRemote } = result;

    // Check if repo exists first
    const repoExistsResponse = await this.apiClient.checkRepoExists(repoId);
    if (!repoExistsResponse.exists) {
      // Auto-register repo if it doesn't exist
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

  /**
   * Prompts the user to back up a local environment file that doesn't exist on the server.
   * Performs encryption and cloud storage upon approval.
   * 
   * Used: During initial scan or file creation when no remote copy is found.
   */
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
        const key = await this.getEncryptionKey();
        if (!key) return;

        // Encrypt and upload
        try {
          const hash = hashEnv(content);
          const envCount = countEnvVars(content);

          this.logger.debug(`[Init ${fileName}] Step 4/4: Encrypting content`);
          const { ciphertext, iv } = encryptEnv(content, key, this.logger);

          // Create env on server
          const env = await this.apiClient.createEnv({
            repoId,
            fileName,
            content: `${ciphertext}:${iv}`, // Format: ciphertext:iv
            latestHash: hash,
            envCount
          });

          // Save metadata
          await this.metadataStore.saveEnvMetadataSync(env.id, fileName, hash, envCount);

          this.logger.info(`Successfully initialized ${fileName}`);
          showSuccess(`${fileName} is now backed up and synced.`);
        } catch (cryptoError) {
          const message = cryptoError instanceof Error ? cryptoError.message : 'Encryption failed';
          this.logger.error(`Crypto error during initialization of ${fileName}: ${message}`);
          showError(`Failed to encrypt ${fileName}. Please try again.`);
          return;
        }
      } catch (error) {
        this.logger.error(`Failed to initialize ${fileName}: ${(error as Error).message}`);
        showError(`Failed to initialize ${fileName}. Please try again.`);
      }
    } else {
      this.logger.info(`User declined to initialize ${fileName}`);
    }
  }

  /**
   * Prompts the user to pull an environment file from the cloud that is missing locally.
   * Decrypts and writes the file upon approval.
   * 
   * Used: During initial scan or when a file exists on server but not in local workspace.
   */
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
        const key = await this.getEncryptionKey();
        if (!key) return;
        
        // Parse ciphertext and iv from content (format: ciphertext:iv)
        const [ciphertext, iv] = remoteEnv.content.split(':');
        const decrypted = decryptEnv(ciphertext, iv, key);
        const hash = hashEnv(decrypted);
        const envCount = countEnvVars(decrypted);

        // Create local file
        fs.writeFileSync(uri.fsPath, decrypted, 'utf8');

        // Save metadata
        await this.metadataStore.saveEnvMetadataSync(envId, fileName, hash, envCount);

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

  /**
   * Resolves reconciliation when both local and remote copies exist but they are not yet linked.
   * Handles hash comparison to avoid unnecessary prompts and provides conflict resolution options.
   * 
   * Used: When a user brings a local repo to a new machine where the repo is already registered.
   */
  private async handleFirstTimeSync(uri: Uri, repoId: string, envId: string, fileName: string, remoteEnv?: Env): Promise<void> {
    this.logger.info(`Handling first time sync: ${uri.fsPath}`);
    
    try {
      // Read local file
      const localContent = fs.readFileSync(uri.fsPath, 'utf8');
      const localHash = hashEnv(localContent);

      // Get remote env if not provided
      if (!remoteEnv || !remoteEnv.content) {
        remoteEnv = await this.apiClient.getEnv(envId);
        if (!remoteEnv) {
          this.logger.error(`Failed to fetch remote ${fileName}`);
          return;
        }
      }

      // Get encryption key
      const key = await this.getEncryptionKey();
      if (!key) return;
      
      // Decrypt remote content
      const [ciphertext, iv] = remoteEnv.content.split(':');
      if (!ciphertext || !iv) {
        this.logger.error(`Failed to decrypt ${fileName}`);
        return;
      }
      let remoteContent: string;
      let remoteHash: string;
      try {
         remoteContent = decryptEnv(ciphertext, iv, key);
         remoteHash = hashEnv(remoteContent);
      } catch (error) {
        this.logger.error(`Failed to decrypt ${fileName}: ${error instanceof Error ? error.message : String(error)}`);
        return; 
      }
     
      // Compare hashes
      if (localHash === remoteHash) {
        // Same content, just mark as synced
        const envCount = countEnvVars(localContent);
        await this.metadataStore.saveEnvMetadataSync(envId, fileName, localHash, envCount);
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
        const envCount = countEnvVars(remoteContent);
        await this.metadataStore.saveEnvMetadataSync(envId, fileName, remoteHash, envCount);
        showSuccess(`${fileName} restored from remote.`);
        return;
      } else if (!localEmpty && remoteEmpty) {
        // Remote empty, push local
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

      // Both have content and differ - conflict
      const choice = await showFirstTimeSyncPrompt(fileName);

      if (choice === 'useLocal') {
        // Push local to remote
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
        // Pull remote to local
        fs.writeFileSync(uri.fsPath, remoteContent, 'utf8');
        const envCount = countEnvVars(remoteContent);
        await this.metadataStore.saveEnvMetadataSync(envId, fileName, remoteHash, envCount);
        showSuccess(`Conflict resolved using remote ${fileName}.`);
      }
    } catch (error) {
      this.logger.error(`Failed to handle first time sync for ${fileName}: ${(error as Error).message}`);
      showError(`Failed to sync ${fileName}. ${(error as Error).message}`);
    }
  }
}