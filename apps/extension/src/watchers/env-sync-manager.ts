// sync-manager.ts
import { deriveKey, encryptEnv, hashEnv, decryptEnv } from '../utils/crypto';
import { getCurrentWorkspaceId, getRepoAndEnvIds } from '../utils/repo-detection';
import { DEFAULT_POLL_INTERVAL_SECONDS } from '../lib/constants';
import { Logger } from '../utils/logger';
import { ExtensionContext, Uri, workspace, WorkspaceEdit, Range } from 'vscode';
import { EnvVaultApiClient } from '../api/client';
import { EnvVaultMetadataStore } from '../services/metadata-store';
import { EnvFileWatcher } from './env-file-watcher';
import fs from 'fs';
import { EnvVaultVsCodeSecrets } from '../utils/secrets';

export class SyncManager {
  private static instance: SyncManager; // Singleton instance
  private pollInterval?: NodeJS.Timeout;
  private apiClient: EnvVaultApiClient;
  private secretsManager: EnvVaultVsCodeSecrets;
  private metadataStore: EnvVaultMetadataStore;
  private envFileWatcher: EnvFileWatcher;
  private logger: Logger;
  
  private constructor(apiClient: EnvVaultApiClient, secretsManager: EnvVaultVsCodeSecrets, metadataStore: EnvVaultMetadataStore, envFileWatcher: EnvFileWatcher, logger: Logger) {
    this.apiClient = apiClient;
    this.secretsManager = secretsManager;
    this.metadataStore = metadataStore;
    this.envFileWatcher = envFileWatcher;
    this.logger = logger;
  }
  public static getInstance(apiClient: EnvVaultApiClient, secretsManager: EnvVaultVsCodeSecrets, metadataStore: EnvVaultMetadataStore, envFileWatcher: EnvFileWatcher, logger: Logger): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager(apiClient, secretsManager, metadataStore, envFileWatcher, logger);
      envFileWatcher.onDidCreate(event => SyncManager.instance.handleNewEnvFile(event.uri));
      envFileWatcher.onDidChange(event => SyncManager.instance.handleEnvFileSave(event.uri));
      envFileWatcher.onDidDelete(event => SyncManager.instance.handleDeletedEnvFile(event.uri));
    }
    return SyncManager.instance;
  }
  public async pollRemoteChanges(): Promise<void> {
    const repoId = await getCurrentWorkspaceId();
    if (!repoId) {
      return;
    }
    const envs = await this.apiClient.getEnvs(repoId ?? '');
    for (const env of envs) {
      const metadata = await this.metadataStore.loadEnvMetadata(env.id);
      if (!metadata) {
        continue;
      }
    }
  }
  
  public startPolling(): void {
    const interval = DEFAULT_POLL_INTERVAL_SECONDS * 1000;
    this.pollInterval = setInterval(() => this.pollRemoteChanges(), interval);
  }

  public async handleEnvFileSave(uri: Uri): Promise<void> {
    const { repoId, envId } = await getRepoAndEnvIds(uri.fsPath) ?? { repoId: '', envId: '' };
    if (!repoId || !envId) {
      return;
    }
    const env = fs.readFileSync(uri.fsPath, 'utf8');
    const hash = hashEnv(env);
    const metadata = await this.metadataStore.loadEnvMetadata(envId);
    if (!metadata) {
      return;
    }
    if (metadata.lastSyncedHash === hash) {
      return;
    }
    await this.apiClient.updateEnv(envId, { content: encryptEnv(env,  deriveKey(await this.secretsManager.getKeyMaterial() ?? '', await this.secretsManager.getDeviceId() ?? '')).ciphertext });
  }
  public async handleNewEnvFile(uri: Uri): Promise<void> {
    const { repoId, envId } = await getRepoAndEnvIds(uri.fsPath) ?? { repoId: '', envId: '' };
    if (!repoId || !envId) {
      return;
    }
    const env = fs.readFileSync(uri.fsPath, 'utf8');
    const hash = hashEnv(env);
    await this.apiClient.createEnv({ repoId, fileName: uri.fsPath, content: encryptEnv(env,  deriveKey(await this.secretsManager.getKeyMaterial() ?? '', await this.secretsManager.getDeviceId() ?? '')).ciphertext });
  }
  public async handleDeletedEnvFile(uri: Uri): Promise<void> {
    const { repoId, envId } = await getRepoAndEnvIds(uri.fsPath) ?? { repoId: '', envId: '' };
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

  // public async resolveConflict(envId: string, choice: 'local' | 'remote'): Promise<void> {
  //   try {
  //     const metadata = await this.metadataStore.loadEnvMetadata(envId);
  //     if (!metadata) {
  //       this.logger.error(`No metadata found for envId: ${envId}`);
  //       return;
  //     }

  //     const remoteEnv = await this.apiClient.getEnv(envId);
  //     if (!remoteEnv) {
  //       this.logger.error(`No remote env found for envId: ${envId}`);
  //       return;
  //     }

  //     const key = deriveKey(
  //       await this.secretsManager.getKeyMaterial() ?? '',
  //       await this.secretsManager.getDeviceId() ?? ''
  //     );

  //     if (choice === 'local') {
  //       // Push local version to remote
  //       const localContent = fs.readFileSync(metadata.fileName, 'utf8');
  //       const encrypted = encryptEnv(localContent, key);
  //       await this.apiClient.updateEnv(envId, { content: encrypted.ciphertext });
        
  //       // Update metadata with new hash
  //       const newHash = hashEnv(localContent);
  //       await this.metadataStore.saveEnvMetadata(envId, {
  //         ...metadata,
  //         lastSyncedHash: newHash,
  //       });
        
  //       this.logger.info(`Resolved conflict for ${envId} by pushing local changes`);
  //     } else {
  //       // Pull remote version to local
  //       const decrypted = decryptEnv(remoteEnv.content, remoteEnv.iv, key);
  //       const uri = Uri.file(metadata.fileName);
  //       await this.updateFileInVscode(uri, decrypted);
        
  //       // Update metadata with new hash
  //       const newHash = hashEnv(decrypted);
  //       await this.metadataStore.saveEnvMetadata(envId, {
  //         ...metadata,
  //         lastSyncedHash: newHash,
  //       });
        
  //       this.logger.info(`Resolved conflict for ${envId} by pulling remote changes`);
  //     }
  //   } catch (error) {
  //     this.logger.error(`Failed to resolve conflict for ${envId}: ${(error as Error).message}`);
  //     throw error;
  //   }
  // }
}