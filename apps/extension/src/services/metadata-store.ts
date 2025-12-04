import { ExtensionContext, EventEmitter } from "vscode";
import { METADATA_STORAGE_KEY } from "../lib/constants";

export interface EnvMetadata {
  envId: string;
  fileName: string;
  lastSyncedHash: string;
  lastSyncedAt: string; // ISO timestamp
}

interface EnvVaultMetadataStorage {
  [envId: string]: EnvMetadata;
}

export class EnvVaultMetadataStore {
  private static instance: EnvVaultMetadataStore;
  private ctx: ExtensionContext;
  private _onDidChangeMetadata = new EventEmitter<string>();
  public readonly onDidChangeMetadata = this._onDidChangeMetadata.event;

  private constructor(ctx: ExtensionContext) {
    this.ctx = ctx;
  }

  public static getInstance(ctx: ExtensionContext): EnvVaultMetadataStore {
    if (!EnvVaultMetadataStore.instance) {
      EnvVaultMetadataStore.instance = new EnvVaultMetadataStore(ctx);
    }
    return EnvVaultMetadataStore.instance;
  }

  public async getAllMetadata(): Promise<Map<string, EnvMetadata>> {
    const stored = this.ctx.workspaceState?.get<EnvVaultMetadataStorage>(METADATA_STORAGE_KEY) || {};
    return new Map(Object.entries(stored));
  }

  public async loadEnvMetadata(envId: string): Promise<EnvMetadata | undefined> {
    const allMetadata = this.ctx.workspaceState?.get<EnvVaultMetadataStorage>(METADATA_STORAGE_KEY) || {};
    return allMetadata[envId];
  }

  public async saveEnvMetadata(envId: string, metadata: EnvMetadata): Promise<void> {
    const allMetadata = this.ctx.workspaceState?.get<EnvVaultMetadataStorage>(METADATA_STORAGE_KEY) || {};
    allMetadata[envId] = metadata;
    await this.ctx.workspaceState?.update(METADATA_STORAGE_KEY, allMetadata);
    this._onDidChangeMetadata.fire(envId);
  }

  public async saveAllMetadata(metadata: Map<string, EnvMetadata>): Promise<void> {
    const obj = Object.fromEntries(metadata);
    await this.ctx.workspaceState?.update(METADATA_STORAGE_KEY, obj);
    this._onDidChangeMetadata.fire('*');
  }

  /**
   * Convenience method to save metadata with just envId, fileName, and hash.
   * Automatically sets lastSyncedAt to current time.
   */
  public async saveEnvMetadataSync(
    envId: string,
    fileName: string,
    hash: string
  ): Promise<void> {
    const metadata: EnvMetadata = {
      envId,
      fileName,
      lastSyncedHash: hash,
      lastSyncedAt: new Date().toISOString(),
    };
    await this.saveEnvMetadata(envId, metadata);
  }

  /**
   * Get all tracked environment files.
   */
  public async getAllTrackedEnvs(): Promise<EnvMetadata[]> {
    const all = await this.getAllMetadata();
    return Array.from(all.values());
  }

  /**
   * Clear metadata for a specific env, or all envs if envId is not provided.
   */
  public async clearMetadata(envId?: string): Promise<void> {
    if (envId) {
      const all = await this.getAllMetadata();
      all.delete(envId);
      await this.saveAllMetadata(all);
    } else {
      await this.ctx.workspaceState?.update(METADATA_STORAGE_KEY, {});
      this._onDidChangeMetadata.fire('*');
    }
  }
}