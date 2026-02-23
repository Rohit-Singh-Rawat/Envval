// repo-identity-store.ts
import * as vscode from "vscode";
import { REPO_IDENTITIES_STORAGE_KEY } from "../lib/constants";

/**
 * Data structure for storing repo identity information
 */
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

/**
 * Service for managing persistent repo identity mappings across workspaces.
 * Uses VSCode's globalState for persistence and cross-device sync when VSCode settings sync is enabled.
 */
export class RepoIdentityStore {
  private static readonly STORAGE_KEY = REPO_IDENTITIES_STORAGE_KEY;

  constructor(private context: vscode.ExtensionContext) {}

  /**
   * Get stored identity data for a workspace
   */
  private getStoredData(workspacePath: string): RepoIdentityData | undefined {
    const allData = this.context.globalState.get<{
      [workspacePath: string]: RepoIdentityData;
    }>(RepoIdentityStore.STORAGE_KEY, {});
    return allData[workspacePath];
  }

  /**
   * Store identity data for a workspace
   */
  private setStoredData(
    workspacePath: string,
    data: RepoIdentityData,
  ): Thenable<void> {
    const allData = this.context.globalState.get<{
      [workspacePath: string]: RepoIdentityData;
    }>(RepoIdentityStore.STORAGE_KEY, {});
    allData[workspacePath] = data;
    return this.context.globalState.update(
      RepoIdentityStore.STORAGE_KEY,
      allData,
    );
  }

  /**
   * Get repo identity for a workspace path
   */
  getRepoIdentity(workspacePath: string): RepoIdentityData | undefined {
    return this.getStoredData(workspacePath);
  }

  /**
   * Set manual repo identity override
   */
  async setManualIdentity(
    workspacePath: string,
    identity: string,
  ): Promise<void> {
    const data =
      this.getStoredData(workspacePath) ||
      this.createDefaultData(workspacePath);
    data.manualIdentity = identity;
    data.identitySource = "manual";
    data.lastUpdatedAt = new Date().toISOString();
    await this.setStoredData(workspacePath, data);
  }

  /**
   * Update Git remote history for a workspace
   */
  async updateGitRemote(
    workspacePath: string,
    remoteUrl: string,
    normalizedUrl: string,
  ): Promise<void> {
    const data =
      this.getStoredData(workspacePath) ||
      this.createDefaultData(workspacePath);

    // Check if this remote is already in history
    const existingIndex = data.gitRemoteHistory.findIndex(
      (h) => h.normalizedUrl === normalizedUrl,
    );
    if (existingIndex >= 0) {
      // Update detection time
      data.gitRemoteHistory[existingIndex].detectedAt =
        new Date().toISOString();
    } else {
      // Add new remote to history
      data.gitRemoteHistory.push({
        url: remoteUrl,
        normalizedUrl,
        detectedAt: new Date().toISOString(),
      });
    }

    data.lastUpdatedAt = new Date().toISOString();
    await this.setStoredData(workspacePath, data);
  }

  /**
   * Set sub-project path for monorepos
   */
  async setSubProjectPath(
    workspacePath: string,
    subPath: string,
  ): Promise<void> {
    const data =
      this.getStoredData(workspacePath) ||
      this.createDefaultData(workspacePath);
    data.subProjectPath = subPath;
    data.lastUpdatedAt = new Date().toISOString();
    await this.setStoredData(workspacePath, data);
  }

  /**
   * Record a repo ID migration
   */
  async migrateRepoId(
    oldRepoId: string,
    newRepoId: string,
    reason: string = "automatic",
  ): Promise<void> {
    // Find all workspaces that might have this repoId and update their migration history
    const allData = this.context.globalState.get<{
      [workspacePath: string]: RepoIdentityData;
    }>(RepoIdentityStore.STORAGE_KEY, {});

    for (const [workspacePath, data] of Object.entries(allData)) {
      // Add migration record
      data.migrationHistory.push({
        fromRepoId: oldRepoId,
        toRepoId: newRepoId,
        migratedAt: new Date().toISOString(),
        reason,
      });

      // Update last modified time
      data.lastUpdatedAt = new Date().toISOString();

      // Update the stored data
      await this.setStoredData(workspacePath, data);
    }
  }

  /**
   * Update the last active repo ID for a workspace.
   * This is used to track "successful" identity usage to detect subsequent changes.
   */
  async updateLastActiveRepoId(
    workspacePath: string,
    repoId: string,
  ): Promise<void> {
    const data =
      this.getStoredData(workspacePath) ||
      this.createDefaultData(workspacePath);
    // Only update if it's different to save writes
    if (data.lastActiveRepoId !== repoId) {
      data.lastActiveRepoId = repoId;
      data.lastUpdatedAt = new Date().toISOString();
      await this.setStoredData(workspacePath, data);
    }
  }

  /**
   * Clear identity for a workspace (reset to automatic detection)
   */
  async clearIdentity(workspacePath: string): Promise<void> {
    const data = this.getStoredData(workspacePath);
    if (data) {
      data.manualIdentity = undefined;
      data.identitySource = "content"; // Reset to content-based detection
      data.lastActiveRepoId = undefined; // Reset active ID so we don't migrate from old garbage
      data.lastUpdatedAt = new Date().toISOString();
      await this.setStoredData(workspacePath, data);
    }
  }

  /**
   * Get all workspaces with stored identity data
   */
  getAllStoredIdentities(): { [workspacePath: string]: RepoIdentityData } {
    return this.context.globalState.get<{
      [workspacePath: string]: RepoIdentityData;
    }>(RepoIdentityStore.STORAGE_KEY, {});
  }

  /**
   * Check if a workspace has a manual identity override
   */
  hasManualIdentity(workspacePath: string): boolean {
    const data = this.getStoredData(workspacePath);
    return data?.manualIdentity !== undefined;
  }

  /**
   * Get the most recent Git remote for a workspace from history
   */
  getMostRecentGitRemote(
    workspacePath: string,
  ): { url: string; normalizedUrl: string } | undefined {
    const data = this.getStoredData(workspacePath);
    if (!data?.gitRemoteHistory.length) {
      return undefined;
    }

    // Sort by detection time, most recent first
    const sorted = data.gitRemoteHistory.sort(
      (a, b) =>
        new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime(),
    );

    return {
      url: sorted[0].url,
      normalizedUrl: sorted[0].normalizedUrl,
    };
  }

  /**
   * Create default identity data structure
   */
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
