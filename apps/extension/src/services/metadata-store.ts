import { ExtensionContext, EventEmitter } from "vscode";
import { METADATA_STORAGE_KEY } from "../lib/constants";
import { computeEnvId } from "../utils/repo-detection";

export interface EnvMetadata {
  envId: string;
  fileName: string;
  lastSyncedHash: string;
  lastSyncedAt: string; // ISO timestamp
  envCount: number;
  ignoredAt?: string; // ISO timestamp for when user skipped sync
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
   * Convenience method to save metadata with just envId, fileName, hash, and envCount.
   * Automatically sets lastSyncedAt to current time.
   */
  public async saveEnvMetadataSync(
    envId: string,
    fileName: string,
    hash: string,
    envCount: number
  ): Promise<void> {
    const metadata: EnvMetadata = {
      envId,
      fileName,
      lastSyncedHash: hash,
      lastSyncedAt: new Date().toISOString(),
      envCount,
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

  /**
   * Mark an environment as ignored (skipped by user).
   */
  public async markAsIgnored(envId: string): Promise<void> {
    const metadata = await this.loadEnvMetadata(envId);
    if (metadata) {
      metadata.ignoredAt = new Date().toISOString();
      await this.saveEnvMetadata(envId, metadata);
    }
  }

  /**
   * Clear the ignore status of an environment.
   */
  public async clearIgnoredAt(envId: string): Promise<void> {
    const metadata = await this.loadEnvMetadata(envId);
    if (metadata) {
      delete metadata.ignoredAt;
      await this.saveEnvMetadata(envId, metadata);
    }
  }

  /**
   * Migrate all metadata entries from one repoId to another.
   * This is used when repository identity changes (e.g., local repo gets a Git remote).
   */
  public async migrateRepoId(oldRepoId: string, newRepoId: string): Promise<number> {
    const allMetadata = await this.getAllMetadata();
    let migratedCount = 0;

    for (const [envId, metadata] of allMetadata) {
      // Extract repoId from envId (envId = hash(repoId + fileName))
      // Since envId is computed as hash(repoId:fileName), we need to find entries that start with oldRepoId
      // But since it's hashed, we need a different approach - we'll check all entries and try to match

      // For migration, we need to recalculate envId for each file that belonged to the old repo
      // Since we don't store the repoId separately, we'll need to extract it from the envId structure
      // This is a limitation of the current design, but we can work around it

      // Verify this environment actually belongs to the old repo
      const expectedOldEnvId = computeEnvId(oldRepoId, metadata.fileName);
      if (expectedOldEnvId !== envId) {
        continue;
      }

      // Get the fileName from metadata and recalculate envId with new repoId
      const newEnvId = computeEnvId(newRepoId, metadata.fileName);

      // Only migrate if the envId would actually change
      if (newEnvId !== envId) {
        // Remove old entry and add new one
        allMetadata.delete(envId);

        // Update the envId in metadata (preserve all existing fields including envCount)
        const newMetadata: EnvMetadata = {
          ...metadata,
          envId: newEnvId
        };

        allMetadata.set(newEnvId, newMetadata);
        migratedCount++;
      }
    }

    if (migratedCount > 0) {
      await this.saveAllMetadata(allMetadata);
    }

    return migratedCount;
  }

  /**
   * Get all environment metadata entries for a specific repository ID.
   * This extracts the repoId from each envId hash by attempting to match against known patterns.
   */
  public async getEnvsByRepoId(repoId: string): Promise<EnvMetadata[]> {
    const allMetadata = await this.getAllMetadata();
    const matchingEnvs: EnvMetadata[] = [];

    for (const metadata of allMetadata.values()) {
      // Since envId is hash(repoId + ":" + fileName), we can't directly extract repoId
      // However, we can check if this envId would be generated by the given repoId
      // by recalculating it and seeing if it matches

      const expectedEnvId = computeEnvId(repoId, metadata.fileName);
      if (expectedEnvId === metadata.envId) {
        matchingEnvs.push(metadata);
      }
    }

    return matchingEnvs;
  }
}