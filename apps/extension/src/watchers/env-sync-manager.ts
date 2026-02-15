import { encryptEnv, hashEnv, decryptEnv, countEnvVars, deriveKeyAsync } from '../utils/crypto';
import { getRepoAndEnvIds, getWorkspacePath } from '../utils/repo-detection';
import { getVSCodeConfig } from '../lib/config';
import { Logger } from '../utils/logger';
import * as vscode from 'vscode';
import { Uri, WorkspaceEdit, Range, window, Disposable } from 'vscode';
import { EnvVaultApiClient, ApiError } from '../api/client';
import { EnvVaultMetadataStore } from '../services/metadata-store';
import { EnvFileWatcher } from './env-file-watcher';
import { EnvInitService } from '../services/env-init';
import fs from 'fs';
import path from 'path';
import { EnvVaultVsCodeSecrets } from '../utils/secrets';
import { IGNORE_INTERVAL_MS, MAX_ENV_FILE_SIZE_BYTES } from '../lib/constants';
import { StatusBar } from '../ui/status-bar';
import { ConnectionMonitor } from '../services/connection-monitor';
import { OperationQueueService } from '../services/operation-queue';

/**
 * Service orchestrating the synchronization between local files and EnvVault.
 * Handles watchers, background polling, and conflict resolution.
 */
export class SyncManager implements Disposable {
  private static instance: SyncManager;
  private pollInterval?: NodeJS.Timeout;
  private readonly context: vscode.ExtensionContext;
  private readonly apiClient: EnvVaultApiClient;
  private readonly secretsManager: EnvVaultVsCodeSecrets;
  private readonly metadataStore: EnvVaultMetadataStore;
  private readonly envInitService: EnvInitService;
  private readonly logger: Logger;

  /**
   * Memory cache for the derived AES key to avoid CPU-intensive PBKDF2 on every operation.
   */
  private cachedKey: string | null = null;

  /**
   * Track in-flight syncs to prevent race conditions (e.g., Save vs Poll).
   */
  private readonly activeSyncs: Set<string> = new Set();

  // TODO: Soft-revoke implementation (future enhancement)
  // Currently unused because devices are hard-deleted (401 response), not soft-revoked (403 response)
  // /**
  //  * Read-only mode flag - set when device is revoked.
  //  * In read-only mode, user can view files but cannot sync changes.
  //  */
  // private readOnlyMode = false;

  private constructor(
    context: vscode.ExtensionContext,
    apiClient: EnvVaultApiClient,
    secretsManager: EnvVaultVsCodeSecrets,
    metadataStore: EnvVaultMetadataStore,
    envFileWatcher: EnvFileWatcher,
    envInitService: EnvInitService,
    logger: Logger
  ) {
    this.context = context;
    this.apiClient = apiClient;
    this.secretsManager = secretsManager;
    this.metadataStore = metadataStore;
    this.envInitService = envInitService;
    this.logger = logger;

    // Register file system watcher events
    const subscriptions = [
      envFileWatcher.onDidCreate(event => this.handleNewEnvFile(event.uri)),
      envFileWatcher.onDidChange(event => this.handleEnvFileSave(event.uri)),
      envFileWatcher.onDidDelete(event => this.handleDeletedEnvFile(event.uri))
    ];
    context.subscriptions.push(...subscriptions);

    // Pause/resume polling based on network connectivity
    const connectionMonitor = ConnectionMonitor.getInstance();
    context.subscriptions.push(
        connectionMonitor.onDidChangeConnectionState(online => {
            if (online) {
                this.logger.info('[SyncManager] Connection restored - resuming sync');
                this.startPolling();
                this.pollRemoteChanges();
            } else {
                this.logger.info('[SyncManager] Connection lost - pausing sync');
                this.stopPolling();
            }
        })
    );
  }

  public static getInstance(
    context: vscode.ExtensionContext,
    apiClient: EnvVaultApiClient,
    secretsManager: EnvVaultVsCodeSecrets,
    metadataStore: EnvVaultMetadataStore,
    envFileWatcher: EnvFileWatcher,
    envInitService: EnvInitService,
    logger: Logger
  ): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager(context, apiClient, secretsManager, metadataStore, envFileWatcher, envInitService, logger);
    }
    return SyncManager.instance;
  }

  /**
   * Performs an asynchronous poll of all tracked environments.
   * Provides real-time feedback via the status bar.
   */
  public async pollRemoteChanges(): Promise<void> {
    if (!ConnectionMonitor.getInstance().isOnline) {
      return;
    }

    const trackedEnvs = await this.metadataStore.getAllTrackedEnvs();
    if (trackedEnvs.length === 0) {
      return;
    }

    StatusBar.getInstance().setSyncState(true);
    try {
      for (const localMeta of trackedEnvs) {
        if (this.activeSyncs.has(localMeta.envId)) {
          continue;
        }

        this.activeSyncs.add(localMeta.envId);
        try {
          // Check if user recently chose to ignore this file
          if (localMeta.ignoredAt) {
            const ignoredTime = new Date(localMeta.ignoredAt).getTime();
            if (Date.now() - ignoredTime < IGNORE_INTERVAL_MS) {
              continue;
            }
          }

          let remoteEnv;
          try {
            remoteEnv = await this.apiClient.getEnv(localMeta.envId);
          } catch (error: unknown) {
            if (error instanceof ApiError && error.status === 404) {
              this.logger.warn(`Remote env ${localMeta.envId} missing. Triggering reconciliation.`);
              const workspacePath = await getWorkspacePath();
              if (workspacePath) {
                await this.envInitService.maybeInitializeOrRestore(Uri.file(path.join(workspacePath, localMeta.fileName)));
              }
              continue;
            }
            throw error;
          }

          if (!remoteEnv) {
            continue;
          }

          const key = await this.getEncryptionKey();
          if (!key) {
            continue;
          }

          const [ciphertext, iv] = remoteEnv.content.split(':');
          if (!ciphertext || !iv) {
            this.logger.error(`Invalid remote format for ${localMeta.fileName}`);
            continue;
          }

          const remoteContent = decryptEnv(ciphertext, iv, key);
          const remoteHash = hashEnv(remoteContent);

          if (remoteHash === localMeta.lastSyncedHash) {
            continue;
          }

          const workspacePath = await getWorkspacePath();
          if (!workspacePath) {
            continue;
          }

          const localFilePath = path.join(workspacePath, localMeta.fileName);
          if (!fs.existsSync(localFilePath)) {
            this.logger.info(`Ghost file detected: ${localMeta.fileName}`);
            await this.envInitService.maybeInitializeOrRestore(Uri.file(localFilePath));
            continue;
          }

          const localContent = fs.readFileSync(localFilePath, 'utf8');
          const localHash = hashEnv(localContent);

          // Standard three-way reconciliation logic
          if (localHash === localMeta.lastSyncedHash) {
            await this.applyRemoteUpdate(Uri.file(localFilePath), remoteContent, remoteHash);
          } else {
            await this.handleConflict(Uri.file(localFilePath), localMeta.envId, localMeta.fileName, localContent, localHash, remoteContent, remoteHash);
          }
        } catch (error: unknown) {
          this.logger.error(`Error polling ${localMeta.fileName}: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
          this.activeSyncs.delete(localMeta.envId);
        }
      }
    } catch (error: unknown) {
      this.logger.error(`Global sync poll failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      StatusBar.getInstance().setSyncState(false, new Date());
    }
  }

  private async applyRemoteUpdate(uri: Uri, content: string, hash: string): Promise<void> {
    await this.updateFileInVscode(uri, content);
    const envCount = countEnvVars(content);
    const fileName = path.basename(uri.fsPath);
    const result = await getRepoAndEnvIds(fileName, undefined, this.context);
    if (result) {
      await this.metadataStore.saveEnvMetadataSync(result.envId, fileName, hash, envCount);
      this.logger.info(`Auto-pulled updates for ${fileName}`);
    }
  }

  private async handleConflict(
    uri: Uri,
    envId: string,
    fileName: string,
    localContent: string,
    localHash: string,
    remoteContent: string,
    remoteHash: string
  ): Promise<void> {
    const choice = await window.showWarningMessage(
      `EnvVault Conflict: ${fileName} has local and remote changes.`,
      { modal: true },
      'Use Local',
      'Use Remote'
    );

    try {
      if (choice === 'Use Local') {
        await this.pushEnv(envId);
      } else if (choice === 'Use Remote') {
        await this.applyRemoteUpdate(uri, remoteContent, remoteHash);
      }
    } catch (error: unknown) {
      this.logger.error(`Conflict resolution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public startPolling(): void {
    const config = getVSCodeConfig();
    const interval = config.pollIntervalSeconds * 1000;
    this.pollInterval = setInterval(() => this.pollRemoteChanges(), interval);
  }

  public stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
    }
  }

  public async handleEnvFileSave(uri: Uri): Promise<void> {
    const fileName = path.basename(uri.fsPath);
    const result = await getRepoAndEnvIds(fileName, undefined, this.context);
    if (!result) {
      return;
    }

    const { envId } = result;
    if (!ConnectionMonitor.getInstance().isOnline) {
      OperationQueueService.getInstance().enqueue('push', envId, fileName);
      this.logger.info(`[SyncManager] Offline - queued push for ${fileName}`);
      return;
    }
    if (this.activeSyncs.has(envId)) {
      return;
    }

    this.activeSyncs.add(envId);
    StatusBar.getInstance().setSyncState(true);

    try {
      if (!fs.existsSync(uri.fsPath)) {
        return;
      }

      const stat = fs.statSync(uri.fsPath);
      if (stat.size > MAX_ENV_FILE_SIZE_BYTES) {
        window.showErrorMessage(`EnvVault: ${fileName} is too large to sync (${Math.round(stat.size / 1024)}KB, max ${MAX_ENV_FILE_SIZE_BYTES / 1000}KB)`);
        return;
      }

      const content = fs.readFileSync(uri.fsPath, 'utf8');
      const hash = hashEnv(content);
      const metadata = await this.metadataStore.loadEnvMetadata(envId);

      if (!metadata) {
        await this.envInitService.maybeInitializeOrRestore(uri);
        return;
      }

      if (metadata.lastSyncedHash === hash) {
        return;
      }

      const key = await this.getEncryptionKey();
      if (!key) {
        return;
      }

      const { ciphertext, iv } = encryptEnv(content, key);
      const envCount = countEnvVars(content);

      try {
        await this.apiClient.updateEnv(envId, {
          baseHash: metadata.lastSyncedHash,
          content: `${ciphertext}:${iv}`,
          latestHash: hash,
          envCount
        });

        await this.metadataStore.saveEnvMetadataSync(envId, fileName, hash, envCount);
        this.logger.info(`Synced ${fileName}`);
      } catch (error: unknown) {
        if (error instanceof ApiError && error.status === 404) {
          await this.metadataStore.clearMetadata(envId);
          await this.envInitService.maybeInitializeOrRestore(uri);
        }
        // TODO: Soft-revoke implementation (future enhancement)
        // Currently devices are hard-deleted (sessions deleted → 401 response)
        // When soft-revoke is implemented, this will enable graceful read-only mode
        /*
        else if (error instanceof ApiError && error.status === 403) {
          // Device revoked - enter read-only mode
          this.enterReadOnlyMode();
          window.showErrorMessage(
            'Your device has been revoked. You can view files but cannot sync changes.',
            'Re-authenticate'
          ).then(choice => {
            if (choice === 'Re-authenticate') {
              vscode.commands.executeCommand('envval.logout');
            }
          });
        }
        */
        else if (error instanceof ApiError && error.status === 412) {
          // Conflict detected - environment was modified by another device
          this.logger.warn(`Conflict detected for ${fileName} - showing resolution dialog`);
          const choice = await window.showWarningMessage(
            `Conflict: ${fileName} was modified on another device`,
            'Use Local (overwrite remote)',
            'Use Remote (discard local)',
            'Cancel'
          );

          if (choice === 'Use Local (overwrite remote)') {
            // Force push with current hash as baseHash
            await this.pushEnv(envId);
          } else if (choice === 'Use Remote (discard local)') {
            // Pull latest from remote
            const remoteEnv = await this.apiClient.getEnv(envId);
            const key = await this.getEncryptionKey();
            if (key && remoteEnv) {
              const [ciphertext, iv] = remoteEnv.content.split(':');
              const remoteContent = decryptEnv(ciphertext, iv, key);
              const remoteHash = hashEnv(remoteContent);
              await this.applyRemoteUpdate(uri, remoteContent, remoteHash);
            }
          }
        } else {
          throw error;
        }
      }
    } catch (error: unknown) {
      this.logger.error(`Auto-sync failed for ${fileName}: ${error instanceof Error ? error.message : String(error)}`);
      window.showErrorMessage(`EnvVault Sync Failed for ${fileName}`);
    } finally {
      this.activeSyncs.delete(envId);
      StatusBar.getInstance().setSyncState(false, new Date());
    }
  }

  public async handleNewEnvFile(uri: Uri): Promise<void> {
    await this.envInitService.maybeInitializeOrRestore(uri);
  }

  public async handleDeletedEnvFile(uri: Uri): Promise<void> {
    const result = await getRepoAndEnvIds(path.basename(uri.fsPath), undefined, this.context);
    if (!result) {
      return;
    }
    const { envId } = result;
    if (!ConnectionMonitor.getInstance().isOnline) {
      this.logger.info(`[SyncManager] Offline - skipping remote delete for ${path.basename(uri.fsPath)}`);
      return;
    }
    if (await this.metadataStore.loadEnvMetadata(envId)) {
       await this.apiClient.deleteEnv(envId);
    }
  }

  public async updateFileInVscode(uri: Uri, content: string): Promise<void> {
    const edit = new WorkspaceEdit();
    const document = await vscode.workspace.openTextDocument(uri);
    const fullRange = new Range(
      document.positionAt(0),
      document.positionAt(document.getText().length)
    );
    edit.replace(uri, fullRange, content);
    await vscode.workspace.applyEdit(edit);
    await document.save();
  }

  public async pushEnv(envId: string): Promise<void> {
    if (this.activeSyncs.has(envId)) {
      return;
    }

    const metadata = await this.metadataStore.loadEnvMetadata(envId);
    if (!metadata) {
      return;
    }

    if (!ConnectionMonitor.getInstance().isOnline) {
      OperationQueueService.getInstance().enqueue('push', envId, metadata.fileName);
      window.showInformationMessage(`EnvVault: Queued push for ${metadata.fileName} (offline)`);
      return;
    }

    this.activeSyncs.add(envId);
    StatusBar.getInstance().setSyncState(true);

    try {
      const workspacePath = await getWorkspacePath();
      if (!workspacePath) {
        return;
      }

      const filePath = path.join(workspacePath, metadata.fileName);
      if (!fs.existsSync(filePath)) {
        return;
      }

      const stat = fs.statSync(filePath);
      if (stat.size > MAX_ENV_FILE_SIZE_BYTES) {
        window.showErrorMessage(`EnvVault: ${metadata.fileName} is too large to sync (${Math.round(stat.size / 1024)}KB, max ${MAX_ENV_FILE_SIZE_BYTES / 1000}KB)`);
        return;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const hash = hashEnv(content);
      const key = await this.getEncryptionKey();
      if (!key) {
        return;
      }

      const { ciphertext, iv } = encryptEnv(content, key);
      const envCount = countEnvVars(content);

      await this.apiClient.updateEnv(envId, {
        baseHash: metadata.lastSyncedHash,
        content: `${ciphertext}:${iv}`,
        latestHash: hash,
        envCount
      });

      await this.metadataStore.saveEnvMetadataSync(envId, metadata.fileName, hash, envCount);
      window.showInformationMessage(`EnvVault: Pushed ${metadata.fileName}`);
    } catch (error: unknown) {
      // TODO: Soft-revoke implementation (future enhancement)
      /*
      if (error instanceof ApiError && error.status === 403) {
        // Device revoked - enter read-only mode
        this.enterReadOnlyMode();
        window.showErrorMessage(
          'Your device has been revoked. You can view files but cannot sync changes.',
          'Re-authenticate'
        ).then(choice => {
          if (choice === 'Re-authenticate') {
            vscode.commands.executeCommand('envval.logout');
          }
        });
      } else
      */
      if (error instanceof ApiError && error.status === 412) {
        // Conflict detected
        this.logger.warn(`Push conflict for ${metadata.fileName}`);
        const choice = await window.showWarningMessage(
          `Conflict: ${metadata.fileName} was modified on another device`,
          'Force Push (overwrite remote)',
          'Pull Remote (discard local)',
          'Cancel'
        );

        if (choice === 'Force Push (overwrite remote)') {
          // Retry push - will use current hash
          await this.pushEnv(envId);
        } else if (choice === 'Pull Remote (discard local)') {
          const remoteEnv = await this.apiClient.getEnv(envId);
          const key = await this.getEncryptionKey();
          if (key && remoteEnv) {
            const [ciphertext, iv] = remoteEnv.content.split(':');
            const remoteContent = decryptEnv(ciphertext, iv, key);
            const remoteHash = hashEnv(remoteContent);
            const workspacePath = await getWorkspacePath();
            if (workspacePath) {
              await this.applyRemoteUpdate(
                Uri.file(path.join(workspacePath, metadata.fileName)),
                remoteContent,
                remoteHash
              );
            }
          }
        }
      } else {
        this.logger.error(`Manual push failed: ${error instanceof Error ? error.message : String(error)}`);
        window.showErrorMessage(`EnvVault Push Failed.`);
      }
    } finally {
      this.activeSyncs.delete(envId);
      StatusBar.getInstance().setSyncState(false, new Date());
    }
  }

  /**
   * Processes all queued offline operations. Called when connection is restored.
   */
  public async processQueuedOperations(): Promise<void> {
    const queue = OperationQueueService.getInstance();
    if (queue.isEmpty) {
      return;
    }

    this.logger.info(`[SyncManager] Processing ${queue.size} queued operations`);

    const result = await queue.processAll(async (op) => {
      if (op.type === 'push') {
        try {
          await this.pushEnv(op.envId);
          return true;
        } catch {
          return false;
        }
      }
      return false;
    });

    if (result.succeeded > 0) {
      window.showInformationMessage(
        `EnvVault: Back online - synced ${result.succeeded} queued change${result.succeeded > 1 ? 's' : ''}`
      );
    }
  }

  private async getEncryptionKey(): Promise<string | null> {
    if (this.cachedKey) {
      return this.cachedKey;
    }

    const keyMaterial = await this.secretsManager.getKeyMaterial();
    const userId = await this.secretsManager.getUserId();

    if (!keyMaterial || !userId) {
      return null;
    }

    this.cachedKey = await deriveKeyAsync(keyMaterial, userId);
    return this.cachedKey;
  }

  public invalidateCache(): void {
    this.cachedKey = null;
    this.logger.debug('Key cache invalidated.');
  }

  // TODO: Soft-revoke implementation (future enhancement)
  /*
  private enterReadOnlyMode(revokedAt?: string): void {
    if (this.readOnlyMode) {
      return;
    }

    this.readOnlyMode = true;
    this.stopPolling();
    StatusBar.getInstance().setReadOnly(true, revokedAt);
    vscode.commands.executeCommand('setContext', 'envval:readOnly', true);
    this.logger.warn(`[SyncManager] Entered read-only mode - device revoked at ${revokedAt || 'unknown time'}`);
  }
  */

  public dispose(): void {
    this.stopPolling();
  }
}
