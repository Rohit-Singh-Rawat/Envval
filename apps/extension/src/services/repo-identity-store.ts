import * as vscode from "vscode";
import { REPO_IDENTITIES_STORAGE_KEY } from "../lib/constants";

interface RepoIdentityData {
  workspacePath: string;
  manualIdentity?: string;
  gitRemoteHistory: Array<{
    url: string;
    normalizedUrl: string;
    detectedAt: string;
  }>;
  contentSignature?: string;
  subProjectPath?: string;
  identitySource: "manual" | "git" | "stored-git" | "content";
  createdAt: string;
  lastUpdatedAt: string;
  migrationHistory: Array<{
    fromRepoId: string;
    toRepoId: string;
    migratedAt: string;
    reason: string;
  }>;
  lastActiveRepoId?: string;
}

type IdentityStorage = { [workspacePath: string]: RepoIdentityData };

/**
 * Service for managing persistent repo identity mappings across workspaces.
 * Uses VSCode's globalState for persistence and cross-device sync when VSCode settings sync is enabled.
 */
export class RepoIdentityStore {
  private static instance: RepoIdentityStore;
  private static readonly STORAGE_KEY = REPO_IDENTITIES_STORAGE_KEY;

  // All data loaded once from globalState; mutations kept in-memory and flushed on write.
  private cache: IdentityStorage | null = null;

  private constructor(private context: vscode.ExtensionContext) {}

  public static getInstance(ctx: vscode.ExtensionContext): RepoIdentityStore {
    if (!RepoIdentityStore.instance) {
      RepoIdentityStore.instance = new RepoIdentityStore(ctx);
    }
    return RepoIdentityStore.instance;
  }

  private getAllData(): IdentityStorage {
    if (this.cache === null) {
      this.cache = this.context.globalState.get<IdentityStorage>(
        RepoIdentityStore.STORAGE_KEY,
        {},
      );
    }
    return this.cache;
  }

  private getStoredData(workspacePath: string): RepoIdentityData | undefined {
    return this.getAllData()[workspacePath];
  }

  private async setStoredData(
    workspacePath: string,
    data: RepoIdentityData,
  ): Promise<void> {
    const allData = this.getAllData();
    allData[workspacePath] = data;
    await this.context.globalState.update(RepoIdentityStore.STORAGE_KEY, allData);
  }

  /** Clears all stored identities and the in-memory cache. Call on user account switch. */
  public async clearAll(): Promise<void> {
    this.cache = null;
    await this.context.globalState.update(RepoIdentityStore.STORAGE_KEY, {});
  }

  getRepoIdentity(workspacePath: string): RepoIdentityData | undefined {
    return this.getStoredData(workspacePath);
  }

  async setManualIdentity(
    workspacePath: string,
    identity: string,
  ): Promise<void> {
    const data =
      this.getStoredData(workspacePath) ?? this.createDefaultData(workspacePath);
    data.manualIdentity = identity;
    data.identitySource = "manual";
    data.lastUpdatedAt = new Date().toISOString();
    await this.setStoredData(workspacePath, data);
  }

  async updateGitRemote(
    workspacePath: string,
    remoteUrl: string,
    normalizedUrl: string,
  ): Promise<void> {
    const data =
      this.getStoredData(workspacePath) ?? this.createDefaultData(workspacePath);

    const existingIndex = data.gitRemoteHistory.findIndex(
      (h) => h.normalizedUrl === normalizedUrl,
    );
    if (existingIndex >= 0) {
      data.gitRemoteHistory[existingIndex].detectedAt = new Date().toISOString();
    } else {
      data.gitRemoteHistory.push({
        url: remoteUrl,
        normalizedUrl,
        detectedAt: new Date().toISOString(),
      });
    }

    data.lastUpdatedAt = new Date().toISOString();
    await this.setStoredData(workspacePath, data);
  }

  async setSubProjectPath(
    workspacePath: string,
    subPath: string,
  ): Promise<void> {
    const data =
      this.getStoredData(workspacePath) ?? this.createDefaultData(workspacePath);
    data.subProjectPath = subPath;
    data.lastUpdatedAt = new Date().toISOString();
    await this.setStoredData(workspacePath, data);
  }

  /**
   * Records a repo ID migration for a specific workspace only.
   * Only the named workspace's migration history is updated.
   */
  async migrateRepoId(
    workspacePath: string,
    oldRepoId: string,
    newRepoId: string,
    reason = "automatic",
  ): Promise<void> {
    const data =
      this.getStoredData(workspacePath) ?? this.createDefaultData(workspacePath);
    data.migrationHistory.push({
      fromRepoId: oldRepoId,
      toRepoId: newRepoId,
      migratedAt: new Date().toISOString(),
      reason,
    });
    data.lastUpdatedAt = new Date().toISOString();
    await this.setStoredData(workspacePath, data);
  }

  /**
   * Updates the last active repo ID for a workspace.
   * Used to detect subsequent identity changes so migration is only triggered when needed.
   */
  async updateLastActiveRepoId(
    workspacePath: string,
    repoId: string,
  ): Promise<void> {
    const data =
      this.getStoredData(workspacePath) ?? this.createDefaultData(workspacePath);
    if (data.lastActiveRepoId !== repoId) {
      data.lastActiveRepoId = repoId;
      data.lastUpdatedAt = new Date().toISOString();
      await this.setStoredData(workspacePath, data);
    }
  }

  async clearIdentity(workspacePath: string): Promise<void> {
    const data = this.getStoredData(workspacePath);
    if (data) {
      data.manualIdentity = undefined;
      data.identitySource = "content";
      data.lastActiveRepoId = undefined;
      data.lastUpdatedAt = new Date().toISOString();
      await this.setStoredData(workspacePath, data);
    }
  }

  getAllStoredIdentities(): IdentityStorage {
    return this.getAllData();
  }

  hasManualIdentity(workspacePath: string): boolean {
    return this.getStoredData(workspacePath)?.manualIdentity !== undefined;
  }

  getMostRecentGitRemote(
    workspacePath: string,
  ): { url: string; normalizedUrl: string } | undefined {
    const data = this.getStoredData(workspacePath);
    if (!data?.gitRemoteHistory.length) {
      return undefined;
    }

    const sorted = [...data.gitRemoteHistory].sort(
      (a, b) =>
        new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime(),
    );

    return { url: sorted[0].url, normalizedUrl: sorted[0].normalizedUrl };
  }

  private createDefaultData(workspacePath: string): RepoIdentityData {
    return {
      workspacePath,
      gitRemoteHistory: [],
      identitySource: "content",
      createdAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
      migrationHistory: [],
      lastActiveRepoId: undefined,
    };
  }
}
