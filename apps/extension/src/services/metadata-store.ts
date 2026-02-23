import { ExtensionContext, EventEmitter } from "vscode";
import { METADATA_STORAGE_KEY } from "../lib/constants";
import { computeEnvId } from "../utils/repo-detection";

export interface EnvMetadata {
  envId: string;
  fileName: string;
  lastSyncedHash: string;
  lastSyncedAt: string; // ISO timestamp
  envCount: number;
}

interface EnvvalMetadataStorage {
  [envId: string]: EnvMetadata;
}

export class EnvvalMetadataStore {
  private static instance: EnvvalMetadataStore;
  private ctx: ExtensionContext;
  private _onDidChangeMetadata = new EventEmitter<string>();
  public readonly onDidChangeMetadata = this._onDidChangeMetadata.event;

  /**
   * Serialises concurrent writes. Without this, a poll and a file-save running
   * simultaneously both read the same state, then each overwrites the other's
   * update — a classic lost-update. The queue ensures each write sees the
   * result of the previous one.
   */
  private writeQueue: Promise<void> = Promise.resolve();

  private constructor(ctx: ExtensionContext) {
    this.ctx = ctx;
  }

  public static getInstance(ctx: ExtensionContext): EnvvalMetadataStore {
    if (!EnvvalMetadataStore.instance) {
      EnvvalMetadataStore.instance = new EnvvalMetadataStore(ctx);
    }
    return EnvvalMetadataStore.instance;
  }

  // ── Reads ─────────────────────────────────────────────────────────────────
  // workspaceState.get is synchronous so reads are always safe to call
  // concurrently; only writes need to be serialised.

  public async getAllMetadata(): Promise<Map<string, EnvMetadata>> {
    const stored =
      this.ctx.workspaceState.get<EnvvalMetadataStorage>(
        METADATA_STORAGE_KEY,
      ) ?? {};
    return new Map(Object.entries(stored));
  }

  public async loadEnvMetadata(
    envId: string,
  ): Promise<EnvMetadata | undefined> {
    const stored =
      this.ctx.workspaceState.get<EnvvalMetadataStorage>(
        METADATA_STORAGE_KEY,
      ) ?? {};
    return stored[envId];
  }

  public async loadEnvMetadataByFileName(
    fileName: string,
  ): Promise<EnvMetadata | undefined> {
    const stored =
      this.ctx.workspaceState.get<EnvvalMetadataStorage>(
        METADATA_STORAGE_KEY,
      ) ?? {};
    return Object.values(stored).find(
      (metadata) => metadata.fileName === fileName,
    );
  }

  public async getAllTrackedEnvs(): Promise<EnvMetadata[]> {
    const stored =
      this.ctx.workspaceState.get<EnvvalMetadataStorage>(
        METADATA_STORAGE_KEY,
      ) ?? {};
    return Object.values(stored);
  }

  // ── Writes (serialised through writeQueue) ────────────────────────────────

  private enqueueWrite(fn: () => Promise<void>): Promise<void> {
    this.writeQueue = this.writeQueue.then(fn, fn);
    return this.writeQueue;
  }

  public async saveEnvMetadata(
    envId: string,
    metadata: EnvMetadata,
  ): Promise<void> {
    return this.enqueueWrite(async () => {
      const stored =
        this.ctx.workspaceState.get<EnvvalMetadataStorage>(
          METADATA_STORAGE_KEY,
        ) ?? {};
      stored[envId] = metadata;
      await this.ctx.workspaceState.update(METADATA_STORAGE_KEY, stored);
      this._onDidChangeMetadata.fire(envId);
    });
  }

  public async saveAllMetadata(
    metadata: Map<string, EnvMetadata>,
  ): Promise<void> {
    return this.enqueueWrite(async () => {
      await this.ctx.workspaceState.update(
        METADATA_STORAGE_KEY,
        Object.fromEntries(metadata),
      );
      this._onDidChangeMetadata.fire("*");
    });
  }

  /** Convenience write: saves sync result fields and stamps the current time. */
  public async saveEnvMetadataSync(
    envId: string,
    fileName: string,
    hash: string,
    envCount: number,
  ): Promise<void> {
    const metadata: EnvMetadata = {
      envId,
      fileName,
      lastSyncedHash: hash,
      lastSyncedAt: new Date().toISOString(),
      envCount,
    };
    return this.saveEnvMetadata(envId, metadata);
  }

  public async clearMetadata(envId?: string): Promise<void> {
    if (envId) {
      return this.enqueueWrite(async () => {
        const stored =
          this.ctx.workspaceState.get<EnvvalMetadataStorage>(
            METADATA_STORAGE_KEY,
          ) ?? {};
        delete stored[envId];
        await this.ctx.workspaceState.update(METADATA_STORAGE_KEY, stored);
        this._onDidChangeMetadata.fire(envId);
      });
    }
    return this.enqueueWrite(async () => {
      await this.ctx.workspaceState.update(METADATA_STORAGE_KEY, {});
      this._onDidChangeMetadata.fire("*");
    });
  }

  /**
   * Migrates all metadata entries that belonged to `oldRepoId` to use
   * `newRepoId`, re-computing each envId. Runs as a single atomic write.
   */
  public async migrateRepoId(
    oldRepoId: string,
    newRepoId: string,
  ): Promise<number> {
    let migratedCount = 0;

    await this.enqueueWrite(async () => {
      const stored =
        this.ctx.workspaceState.get<EnvvalMetadataStorage>(
          METADATA_STORAGE_KEY,
        ) ?? {};
      let changed = false;

      for (const metadata of Object.values(stored)) {
        const expectedOldEnvId = computeEnvId(oldRepoId, metadata.fileName);
        if (expectedOldEnvId !== metadata.envId) {
          continue;
        }

        const newEnvId = computeEnvId(newRepoId, metadata.fileName);
        if (newEnvId === metadata.envId) {
          continue;
        }

        delete stored[metadata.envId];
        stored[newEnvId] = { ...metadata, envId: newEnvId };
        migratedCount++;
        changed = true;
      }

      if (changed) {
        await this.ctx.workspaceState.update(METADATA_STORAGE_KEY, stored);
        this._onDidChangeMetadata.fire("*");
      }
    });

    return migratedCount;
  }

  public async getEnvsByRepoId(repoId: string): Promise<EnvMetadata[]> {
    const stored =
      this.ctx.workspaceState.get<EnvvalMetadataStorage>(
        METADATA_STORAGE_KEY,
      ) ?? {};
    return Object.values(stored).filter(
      (m) => computeEnvId(repoId, m.fileName) === m.envId,
    );
  }
}
