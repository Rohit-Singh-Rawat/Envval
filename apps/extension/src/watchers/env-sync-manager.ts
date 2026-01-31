import { deriveKey, encryptEnv, hashEnv, decryptEnv, countEnvVars } from '../utils/crypto';
import { getCurrentWorkspaceId, getRepoAndEnvIds, getWorkspacePath } from '../utils/repo-detection';
import { getVSCodeConfig } from '../lib/config';
import { Logger } from '../utils/logger';
import * as vscode from 'vscode';
import { ExtensionContext, Uri, workspace, WorkspaceEdit, Range, window } from 'vscode';
import { EnvVaultApiClient } from '../api/client';
import { EnvVaultMetadataStore } from '../services/metadata-store';
import { EnvFileWatcher } from './env-file-watcher';
import { EnvInitService } from '../services/env-init';
import fs from 'fs';
import path from 'path';
import { EnvVaultVsCodeSecrets } from '../utils/secrets';

export class SyncManager {
  private static instance: SyncManager; 
  private pollInterval?: NodeJS.Timeout;
  private context: vscode.ExtensionContext;
  private apiClient: EnvVaultApiClient;
  private secretsManager: EnvVaultVsCodeSecrets;
  private metadataStore: EnvVaultMetadataStore;
  private envInitService: EnvInitService;
  private logger: Logger;
  
  private constructor(context: vscode.ExtensionContext, apiClient: EnvVaultApiClient, secretsManager: EnvVaultVsCodeSecrets, metadataStore: EnvVaultMetadataStore, envFileWatcher: EnvFileWatcher, envInitService: EnvInitService, logger: Logger) {
    this.context = context;
    this.apiClient = apiClient;
    this.secretsManager = secretsManager;
    this.metadataStore = metadataStore;
    this.envInitService = envInitService;
    this.logger = logger;
  }
  public static getInstance(context: vscode.ExtensionContext, apiClient: EnvVaultApiClient, secretsManager: EnvVaultVsCodeSecrets, metadataStore: EnvVaultMetadataStore, envFileWatcher: EnvFileWatcher, envInitService: EnvInitService, logger: Logger): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager(context, apiClient, secretsManager, metadataStore, envFileWatcher, envInitService, logger);
      envFileWatcher.onDidCreate(event => SyncManager.instance.handleNewEnvFile(event.uri));
      envFileWatcher.onDidChange(event => SyncManager.instance.handleEnvFileSave(event.uri));
      envFileWatcher.onDidDelete(event => SyncManager.instance.handleDeletedEnvFile(event.uri));
    }
    return SyncManager.instance;
  }
  public async pollRemoteChanges(): Promise<void> {
    try {
      // Get all tracked envs from metadata store
      const trackedEnvs = await this.metadataStore.getAllTrackedEnvs();
      
      if (trackedEnvs.length === 0) {
        return;
      }

      for (const localMeta of trackedEnvs) {
        try {
          // Get remote metadata (or fetch full env to compare)
          // For now, we'll fetch the full env to compare hashes
          const remoteEnv = await this.apiClient.getEnv(localMeta.envId);
          if (!remoteEnv) {
            // Remote was deleted, but we still have metadata - skip for now
            continue;
          }

          // Get encryption key
          const keyMaterial = await this.secretsManager.getKeyMaterial();
          const deviceId = await this.secretsManager.getDeviceId();
          if (!keyMaterial || !deviceId) {
            continue;
          }

          const key = deriveKey(keyMaterial, deviceId);
          
          // Decrypt remote content
          const [ciphertext, iv] = remoteEnv.content.split(':');
          const remoteContent = decryptEnv(ciphertext, iv, key);
          const remoteHash = hashEnv(remoteContent);

          // Compare with last synced hash
          if (remoteHash === localMeta.lastSyncedHash) {
            // No remote changes, skip
            continue;
          }

          // Remote has changed - check if local file exists and compare
          const workspacePath = await getWorkspacePath();
          if (!workspacePath) {
            continue;
          }

          const localFilePath = path.join(workspacePath, localMeta.fileName);
          const localExists = fs.existsSync(localFilePath);

          if (!localExists) {
            // Local file was deleted, but remote exists - could restore or skip
            continue;
          }

          // Read local file
          const localContent = fs.readFileSync(localFilePath, 'utf8');
          const localHash = hashEnv(localContent);

          // Check if local is unchanged since last sync
          if (localHash === localMeta.lastSyncedHash) {
            // Local unchanged - safe to auto-pull
            await this.updateFileInVscode(Uri.file(localFilePath), remoteContent);
            const envCount = countEnvVars(remoteContent);
            await this.metadataStore.saveEnvMetadataSync(localMeta.envId, localMeta.fileName, remoteHash, envCount);
            this.logger.info(`Auto-pulled changes for ${localMeta.fileName}`);
            window.showInformationMessage(`EnvVault: ${localMeta.fileName} updated from remote changes.`);
          } else {
            // Both changed - conflict detected
            this.logger.info(`Conflict detected for ${localMeta.fileName}`);
            await this.handleConflict(Uri.file(localFilePath), localMeta.envId, localMeta.fileName, localContent, localHash, remoteContent, remoteHash);
          }
        } catch (error) {
          this.logger.error(`Error polling changes for ${localMeta.fileName}: ${(error as Error).message}`);
        }
      }
    } catch (error) {
      this.logger.error(`Error in pollRemoteChanges: ${(error as Error).message}`);
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
      `EnvVault: Conflict detected for ${fileName}. Both local and remote have changes.`,
      { modal: true },
      'Use Local',
      'Use Remote'
    );

    try {
      if (choice === 'Use Local') {
        // Push local to remote
        const keyMaterial = await this.secretsManager.getKeyMaterial();
        const deviceId = await this.secretsManager.getDeviceId();
        if (!keyMaterial || !deviceId) {
          return;
        }
        
        const key = deriveKey(keyMaterial, deviceId);
        const { ciphertext, iv } = encryptEnv(localContent, key);
        
        const envCount = countEnvVars(localContent);
        await this.apiClient.updateEnv(envId, {
          content: `${ciphertext}:${iv}`,
          latestHash: localHash,
          envCount
        });
        
        await this.metadataStore.saveEnvMetadataSync(envId, fileName, localHash, envCount);
        window.showInformationMessage(`EnvVault: Conflict resolved using local ${fileName}.`);
      } else if (choice === 'Use Remote') {
        // Pull remote to local
        await this.updateFileInVscode(uri, remoteContent);
        const envCount = countEnvVars(remoteContent);
        await this.metadataStore.saveEnvMetadataSync(envId, fileName, remoteHash, envCount);
        window.showInformationMessage(`EnvVault: Conflict resolved using remote ${fileName}.`);
      }
    } catch (error) {
      this.logger.error(`Failed to resolve conflict: ${(error as Error).message}`);
      window.showErrorMessage(`EnvVault: Failed to resolve conflict for ${fileName}.`);
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
    this.logger.info(`[handleEnvFileSave] Started for: ${uri.fsPath}`);
    try {
      this.logger.info(`[handleEnvFileSave] Getting repo and env IDs...`);
      const result = await getRepoAndEnvIds(uri.fsPath, undefined, this.context);
      if (!result) {
        this.logger.error(`Failed to get repo and env ids for ${uri.fsPath}`);
        return;
      }
      
      const { repoId, envId } = result;
      this.logger.info(`[handleEnvFileSave] repoId: ${repoId}, envId: ${envId}`);
      
      // Check if file exists
      if (!fs.existsSync(uri.fsPath)) {
        this.logger.info(`[handleEnvFileSave] File does not exist, skipping: ${uri.fsPath}`);
        return;
      }

      // Read file content
      const content = fs.readFileSync(uri.fsPath, 'utf8');
      const hash = hashEnv(content);
      this.logger.info(`[handleEnvFileSave] Content hash: ${hash}, content length: ${content.length}`);
      
      // Check metadata - if not exists, delegate to init service
      const metadata = await this.metadataStore.loadEnvMetadata(envId);
      this.logger.info(`[handleEnvFileSave] Metadata loaded: ${JSON.stringify(metadata)}`);
      if (!metadata) {
        // Not initialized yet, let init service handle it
        this.logger.info(`[handleEnvFileSave] No metadata found, delegating to init service`);
        await this.envInitService.maybeInitializeOrRestore(uri);
        return;
      }
      
      // Skip if hash matches (no changes)
      if (metadata.lastSyncedHash === hash) {
        this.logger.info(`[handleEnvFileSave] Hash unchanged, skipping sync. lastSyncedHash: ${metadata.lastSyncedHash}`);
        return;
      }
      this.logger.info(`[handleEnvFileSave] Hash changed: ${metadata.lastSyncedHash} -> ${hash}`);

      // Get encryption key
      const keyMaterial = await this.secretsManager.getKeyMaterial();
      const deviceId = await this.secretsManager.getDeviceId();
      if (!keyMaterial || !deviceId) {
        this.logger.error('Missing encryption keys for sync');
        return;
      }
      this.logger.info(`[handleEnvFileSave] Encryption keys available, deviceId: ${deviceId}`);

      const key = deriveKey(keyMaterial, deviceId);
      const { ciphertext, iv } = encryptEnv(content, key);
      const envCount = countEnvVars(content);
      this.logger.info(`[handleEnvFileSave] Encrypted content, envCount: ${envCount}`);

      // Update on server
      this.logger.info(`[handleEnvFileSave] Updating env on server: ${envId}`);
      await this.apiClient.updateEnv(envId, {
        content: `${ciphertext}:${iv}`,
        latestHash: hash,
        envCount
      });
      this.logger.info(`[handleEnvFileSave] Server update successful`);

      // Update metadata with new hash
      await this.metadataStore.saveEnvMetadataSync(envId, metadata.fileName, hash, envCount);
      this.logger.info(`[handleEnvFileSave] Metadata updated`);
      
      this.logger.info(`Successfully synced ${path.basename(uri.fsPath)}`);
    } catch (error) {
      this.logger.error(`Failed to handle env file save: ${(error as Error).message}`);
    }
    
  }
  public async handleNewEnvFile(uri: Uri): Promise<void> {
    // Delegate to init service which handles all scenarios
    await this.envInitService.maybeInitializeOrRestore(uri);
  }
  public async handleDeletedEnvFile(uri: Uri): Promise<void> {
    const { repoId, envId } = await getRepoAndEnvIds(uri.fsPath, undefined, this.context) ?? { repoId: '', envId: '' };
    if (!repoId || !envId) {
      return;
    }
    const metadata = await this.metadataStore.loadEnvMetadata(envId);
    if (!metadata) {
      return;
    }
    await this.apiClient.deleteEnv(envId);
  }
  public async updateFileInVscode(uri: Uri, content: string): Promise<void> {
    try {
      const edit = new WorkspaceEdit();
      const document = await workspace.openTextDocument(uri);
      const fullRange = new Range(
        document.positionAt(0),
        document.positionAt(document.getText().length)
      );
      edit.replace(uri, fullRange, content);
      await workspace.applyEdit(edit);
      await document.save();
      this.logger.info(`Updated file in VSCode: ${uri.fsPath}`);
    } catch (error) {
      this.logger.error(`Failed to update file in VSCode: ${(error as Error).message}`);
      throw error;
    }
  }

  public async pushEnv(envId: string): Promise<void> {
    const remoteEnv = await this.apiClient.getEnv(envId);
    if (!remoteEnv) {
      return;
    }
    const metadata = await this.metadataStore.loadEnvMetadata(envId);
    if (!metadata) {
      return;
    }
  }

}