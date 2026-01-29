// repo-migration.ts
import * as vscode from 'vscode';
import { RepoIdentityStore } from './repo-identity-store';
import { EnvVaultMetadataStore } from './metadata-store';
import type { Logger } from '../utils/logger';

/**
 * Service for handling repo identity migrations when Git remotes are detected
 * or when users manually change repo identities.
 */
export class RepoMigrationService {
  constructor(
    private context: vscode.ExtensionContext,
    private metadataStore: EnvVaultMetadataStore,
    private identityStore: RepoIdentityStore,
    private logger: Logger
  ) {}

  /**
   * Check if migration is needed for a workspace based on current identity detection
   */
  async detectMigrationNeeded(workspacePath: string): Promise<{
    needsMigration: boolean;
    oldRepoId?: string;
    newRepoId?: string;
    reason?: string;
  }> {
    try {
      const currentIdentity = await this.getCurrentIdentitySource(workspacePath);

      if (!currentIdentity) {
        return { needsMigration: false };
      }

      // Check if we're transitioning from content-based to Git-based identity
      if (currentIdentity.source === 'content' && currentIdentity.gitRemote) {
        const storedGitRemote = this.identityStore.getMostRecentGitRemote(workspacePath);
        if (storedGitRemote) {
          // Calculate what the old (content-based) and new (Git-based) repoIds would be
          const oldRepoId = currentIdentity.currentRepoId;
          const newRepoId = await this.calculateGitBasedRepoId(storedGitRemote.normalizedUrl, workspacePath);

          if (oldRepoId !== newRepoId) {
            return {
              needsMigration: true,
              oldRepoId,
              newRepoId,
              reason: 'Git remote detected after using content signature'
            };
          }
        }
      }

      return { needsMigration: false };
    } catch (error) {
      console.error('[RepoMigration] Error detecting migration need:', error);
      return { needsMigration: false };
    }
  }

  /**
   * Prompt user for migration decision
   */
  async promptUserForMigration(oldRepoId: string, newRepoId: string, reason: string): Promise<'migrate' | 'later' | 'keep' | 'cancel'> {
    const message = `Repository identity migration detected.\n\n${reason}\n\nOld ID: ${oldRepoId}\nNew ID: ${newRepoId}\n\nThis will move all your environment variable metadata to the new repository identity.`;

    const selection = await vscode.window.showInformationMessage(
      message,
      { modal: true },
      'Migrate Now',
      'Remind Me Later',
      'Keep Current Identity'
    );

    switch (selection) {
      case 'Migrate Now':
        return 'migrate';
      case 'Remind Me Later':
        return 'later';
      case 'Keep Current Identity':
        return 'keep';
      default:
        return 'cancel';
    }
  }

  /**
   * Perform repository identity migration
   */
  async performMigration(oldRepoId: string, newRepoId: string, workspacePath: string): Promise<{ success: boolean; migratedCount: number }> {
    try {
      console.log(`[RepoMigration] Starting migration from ${oldRepoId} to ${newRepoId}`);

      // Migrate metadata store entries
      const migratedCount = await this.metadataStore.migrateRepoId(oldRepoId, newRepoId);

      // Update identity store with migration record
      await this.identityStore.migrateRepoId(oldRepoId, newRepoId, 'user-initiated');

      // Try to migrate on server (if API supports it)
      try {
        // This will be implemented when we add the API client method
        // await this.apiClient.migrateRepo(oldRepoId, newRepoId);
      } catch (error) {
        console.warn('[RepoMigration] Server migration not supported or failed:', error);
      }

      console.log(`[RepoMigration] Successfully migrated ${migratedCount} metadata entries`);

      // Show success message
      vscode.window.showInformationMessage(
        `Successfully migrated repository identity. ${migratedCount} environment variable entries updated.`
      );

      return { success: true, migratedCount };
    } catch (error) {
      console.error('[RepoMigration] Migration failed:', error);
      vscode.window.showErrorMessage('Repository identity migration failed. Please try again.');

      return { success: false, migratedCount: 0 };
    }
  }

  /**
   * Handle automatic migration prompt based on configuration
   */
  async handleAutomaticMigrationPrompt(workspacePath: string): Promise<void> {
    const config = vscode.workspace.getConfiguration('envval');
    const shouldPrompt = config.get('promptForMigration', true);

    if (!shouldPrompt) {
      return;
    }

    const migrationCheck = await this.detectMigrationNeeded(workspacePath);
    if (!migrationCheck.needsMigration) {
      return;
    }

    const userChoice = await this.promptUserForMigration(
      migrationCheck.oldRepoId!,
      migrationCheck.newRepoId!,
      migrationCheck.reason!
    );

    switch (userChoice) {
      case 'migrate':
        await this.performMigration(migrationCheck.oldRepoId!, migrationCheck.newRepoId!, workspacePath);
        break;
      case 'keep':
        // Set manual override to keep current identity
        await this.identityStore.setManualIdentity(workspacePath, migrationCheck.oldRepoId!);
        break;
      case 'later':
        // Do nothing, user will be prompted again later
        break;
      case 'cancel':
        // Do nothing
        break;
    }
  }

  /**
   * Get current identity information for a workspace
   */
  private async getCurrentIdentitySource(workspacePath: string): Promise<{
    source: string;
    currentRepoId: string;
    gitRemote?: string;
  } | null> {
    try {
      // Import here to avoid circular dependency
      const { getCurrentWorkspaceId } = await import('../utils/repo-detection.js');

      const identity = await getCurrentWorkspaceId(undefined, this.context, this.logger);
      if (!identity) {
        return null;
      }

      return {
        source: identity.identitySource,
        currentRepoId: identity.repoId,
        gitRemote: identity.gitRemote
      };
    } catch (error) {
      console.error('[RepoMigration] Error getting current identity:', error);
      return null;
    }
  }

  /**
   * Calculate what the Git-based repoId would be for a given remote
   */
  private async calculateGitBasedRepoId(normalizedRemote: string, workspacePath: string): Promise<string> {
    const { computeStableRepoId } = await import('../utils/repo-detection.js');

    // Get sub-project path if set
    const storedIdentity = this.identityStore.getRepoIdentity(workspacePath);
    const subProjectPath = storedIdentity?.subProjectPath;

    // Use same userId logic as main detection (for now, assume no userId)
    return await computeStableRepoId(normalizedRemote, undefined, subProjectPath);
  }
}