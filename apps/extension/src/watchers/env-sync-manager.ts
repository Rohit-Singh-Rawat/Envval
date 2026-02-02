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
import { IGNORE_INTERVAL_MS } from '../lib/constants';
import { StatusBar } from '../ui/status-bar';

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
    if (this.activeSyncs.has(envId)) {
      return;
    }

    this.activeSyncs.add(envId);
    StatusBar.getInstance().setSyncState(true);

    try {
      if (!fs.existsSync(uri.fsPath)) {
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

      const content = fs.readFileSync(filePath, 'utf8');
      const hash = hashEnv(content);
      const key = await this.getEncryptionKey();
      if (!key) {
        return;
      }

      const { ciphertext, iv } = encryptEnv(content, key);
      const envCount = countEnvVars(content);

      await this.apiClient.updateEnv(envId, {
        content: `${ciphertext}:${iv}`,
        latestHash: hash,
        envCount
      });

      await this.metadataStore.saveEnvMetadataSync(envId, metadata.fileName, hash, envCount);
      window.showInformationMessage(`EnvVault: Pushed ${metadata.fileName}`);
    } catch (error: unknown) {
      this.logger.error(`Manual push failed: ${error instanceof Error ? error.message : String(error)}`);
      window.showErrorMessage(`EnvVault Push Failed.`);
    } finally {
      this.activeSyncs.delete(envId);
      StatusBar.getInstance().setSyncState(false, new Date());
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

  public dispose(): void {
    this.stopPolling();
  }
}