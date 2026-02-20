// repo-identity.ts
import * as vscode from 'vscode';
import { RepoIdentityStore } from '../services/repo-identity-store';
import { RepoMigrationService } from '../services/repo-migration';
import { EnvvalMetadataStore } from '../services/metadata-store';
import { getCurrentWorkspaceId, detectMonorepoStructure, getAllGitRemotes, getGitRemoteUrl } from '../utils/repo-detection';
import { EnvvalApiClient } from '../api/client';
import type { Logger } from '../utils/logger';
import { formatError } from '../utils/format-error';

/**
 * Command implementations for repository identity management
 */
export class RepoIdentityCommands {
  private _identityStore: RepoIdentityStore | undefined;
  private _migrationService: RepoMigrationService | undefined;

  constructor(
    private context: vscode.ExtensionContext,
    private metadataStore: EnvvalMetadataStore,
    private logger: Logger
  ) {}

  private get identityStore(): RepoIdentityStore {
    if (!this._identityStore) {
      this._identityStore = new RepoIdentityStore(this.context);
    }
    return this._identityStore;
  }

  private get migrationService(): RepoMigrationService {
    if (!this._migrationService) {
      this._migrationService = new RepoMigrationService(
        this.context,
        this.metadataStore,
        this.identityStore,
        this.apiClient,
        this.logger
      );
    }
    return this._migrationService;
  }

  private get apiClient(): EnvvalApiClient {
    return EnvvalApiClient.getInstance();
  }

  /**
   * View current repository identity information
   */
  async viewRepoIdentity(): Promise<void> {
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspacePath) {
      vscode.window.showErrorMessage('No workspace is currently open.');
      return;
    }

    try {
      const identity = await getCurrentWorkspaceId(undefined, this.context);
      if (!identity) {
        vscode.window.showErrorMessage('Unable to determine repository identity.');
        return;
      }

      const storedData = this.identityStore.getRepoIdentity(workspacePath);

      let message = `**Repository Identity Information**\n\n`;
      message += `**Repo ID:** ${identity.repoId}\n`;
      message += `**Identity Source:** ${identity.identitySource}\n`;

      if (identity.gitRemote) {
        message += `**Git Remote:** ${identity.gitRemote}\n`;
        if (identity.gitRemoteType) {
          message += `**Remote Type:** ${identity.gitRemoteType}\n`;
        }
      }

      if (identity.subProjectPath) {
        message += `**Sub-Project Path:** ${identity.subProjectPath}\n`;
      }

      if (identity.monorepoDetected) {
        message += `**Monorepo Detected:** Yes\n`;
        if (identity.availableSubProjects && identity.availableSubProjects.length > 0) {
          message += `**Available Sub-Projects:** ${identity.availableSubProjects.length}\n`;
        }
      }

      if (identity.requiresMigration) {
        message += `\n**⚠️ Migration Recommended:** ${identity.suggestedMigration?.reason}\n`;
        message += `**Suggested New ID:** ${identity.suggestedMigration?.newRepoId}\n`;
      }

      if (storedData?.migrationHistory.length) {
        message += `\n**Migration History:** ${storedData.migrationHistory.length} migrations\n`;
      }

      // Show as information message with action buttons
      const selection = await vscode.window.showInformationMessage(
        message,
        { modal: false },
        'Copy Repo ID',
        'View Migration History',
        'Close'
      );

      switch (selection) {
        case 'Copy Repo ID':
          await vscode.env.clipboard.writeText(identity.repoId);
          vscode.window.showInformationMessage('Repository ID copied to clipboard.');
          break;
        case 'View Migration History':
          await this.showMigrationHistory(workspacePath);
          break;
      }

    } catch (error) {
      this.logger.error(`Error viewing repo identity: ${formatError(error)}`);
      vscode.window.showErrorMessage('Failed to retrieve repository identity information.');
    }
  }

  /**
   * Set manual repository identity override
   */
  async setManualRepoIdentity(): Promise<void> {
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspacePath) {
      vscode.window.showErrorMessage('No workspace is currently open.');
      return;
    }

    try {
      const currentIdentity = await getCurrentWorkspaceId(undefined, this.context);
      const currentId = currentIdentity?.repoId || '';

      const newIdentity = await vscode.window.showInputBox({
        prompt: 'Enter custom repository identity',
        placeHolder: 'e.g., my-custom-repo-name',
        value: currentId,
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Repository identity cannot be empty';
          }
          if (value.length > 100) {
            return 'Repository identity must be 100 characters or less';
          }
          return null;
        }
      });

      if (!newIdentity) {
        return;
      }

      // Check if this is different from current identity
      if (currentId && newIdentity.trim() === currentId) {
        vscode.window.showInformationMessage('Repository identity is already set to this value.');
        return;
      }

      // Store the manual identity
      await this.identityStore.setManualIdentity(workspacePath, newIdentity.trim());

      // Offer to migrate existing metadata
      const envCount = await this.getEnvCountForRepo(currentId);
      if (envCount > 0) {
        const migrate = await vscode.window.showInformationMessage(
          `Found ${envCount} environment variable entries for the current identity. Would you like to migrate them to the new identity?`,
          'Migrate Now',
          'Skip Migration'
        );

        if (migrate === 'Migrate Now' && currentId) {
          await this.migrationService.performMigration(currentId, newIdentity.trim(), workspacePath);
        }
      }

      vscode.window.showInformationMessage(`Repository identity set to: ${newIdentity.trim()}`);

      // Suggest reloading the window
      const reload = await vscode.window.showInformationMessage(
        'Repository identity updated. Reload window to apply changes?',
        'Reload Now',
        'Later'
      );

      if (reload === 'Reload Now') {
        vscode.commands.executeCommand('workbench.action.reloadWindow');
      }

    } catch (error) {
      this.logger.error(`Error setting manual repo identity: ${formatError(error)}`);
      vscode.window.showErrorMessage('Failed to set repository identity.');
    }
  }

  /**
   * Set sub-project path for monorepos
   */
  async setSubProjectPath(): Promise<void> {
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspacePath) {
      vscode.window.showErrorMessage('No workspace is currently open.');
      return;
    }

    try {
      const subProjects = await detectMonorepoStructure(workspacePath);
      const storedIdentity = this.identityStore.getRepoIdentity(workspacePath);

      let selectedPath: string | undefined;

      if (subProjects.length === 0) {
        // No detected sub-projects, allow manual input
        selectedPath = await vscode.window.showInputBox({
          prompt: 'Enter sub-project path (relative to workspace root)',
          placeHolder: 'e.g., packages/my-app or apps/web',
          value: storedIdentity?.subProjectPath || '',
          validateInput: (value) => {
            if (!value || value.trim().length === 0) {
              return 'Sub-project path cannot be empty';
            }
            if (value.startsWith('/') || value.startsWith('\\')) {
              return 'Path should be relative (not start with / or \\)';
            }
            return null;
          }
        });
      } else {
        // Show quick pick of detected sub-projects
        const items = [
          { label: 'Custom Path...', description: 'Enter a custom sub-project path' },
          ...subProjects.map(path => ({
            label: path,
            description: 'Detected sub-project'
          }))
        ];

        const selection = await vscode.window.showQuickPick(items, {
          placeHolder: 'Select sub-project path'
        });

        if (!selection) {
          return;
        }

        if (selection.label === 'Custom Path...') {
          selectedPath = await vscode.window.showInputBox({
            prompt: 'Enter sub-project path',
            placeHolder: 'e.g., packages/my-app',
            validateInput: (value) => {
              if (!value || value.trim().length === 0) {
                return 'Sub-project path cannot be empty';
              }
              return null;
            }
          });
        } else {
          selectedPath = selection.label;
        }
      }

      if (!selectedPath) {
        return;
      }

      // Store the sub-project path
      await this.identityStore.setSubProjectPath(workspacePath, selectedPath.trim());

      // Offer to migrate if current identity changes
      const currentIdentity = await getCurrentWorkspaceId(undefined, this.context);
      const newIdentity = await getCurrentWorkspaceId(undefined, this.context);

      if (currentIdentity?.repoId !== newIdentity?.repoId && currentIdentity?.repoId) {
        const migrate = await vscode.window.showInformationMessage(
          'Sub-project path change will update repository identity. Migrate existing metadata?',
          'Migrate Now',
          'Skip Migration'
        );

        if (migrate === 'Migrate Now' && newIdentity?.repoId) {
          await this.migrationService.performMigration(currentIdentity.repoId, newIdentity.repoId, workspacePath);
        }
      }

      vscode.window.showInformationMessage(`Sub-project path set to: ${selectedPath.trim()}`);

    } catch (error) {
      this.logger.error(`Error setting sub-project path: ${formatError(error)}`);
      vscode.window.showErrorMessage('Failed to set sub-project path.');
    }
  }

  /**
   * Reset repository identity to automatic detection
   */
  async resetRepoIdentity(): Promise<void> {
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspacePath) {
      vscode.window.showErrorMessage('No workspace is currently open.');
      return;
    }

    try {
      const confirm = await vscode.window.showWarningMessage(
        'This will clear all manual repository identity overrides and return to automatic detection. Continue?',
        'Reset Identity',
        'Cancel'
      );

      if (confirm !== 'Reset Identity') {
        return;
      }

      await this.identityStore.clearIdentity(workspacePath);

      vscode.window.showInformationMessage('Repository identity reset to automatic detection.');

      // Suggest reloading the window
      const reload = await vscode.window.showInformationMessage(
        'Repository identity reset. Reload window to apply changes?',
        'Reload Now',
        'Later'
      );

      if (reload === 'Reload Now') {
        vscode.commands.executeCommand('workbench.action.reloadWindow');
      }

    } catch (error) {
      this.logger.error(`Error resetting repo identity: ${formatError(error)}`);
      vscode.window.showErrorMessage('Failed to reset repository identity.');
    }
  }

  /**
   * Manually trigger repository identity migration
   */
  async migrateRepoIdentity(): Promise<void> {
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspacePath) {
      vscode.window.showErrorMessage('No workspace is currently open.');
      return;
    }

    try {
      const migrationCheck = await this.migrationService.detectMigrationNeeded(workspacePath);

      if (!migrationCheck.needsMigration || !migrationCheck.oldRepoId || !migrationCheck.newRepoId || !migrationCheck.reason) {
        vscode.window.showInformationMessage('No migration needed for this workspace.');
        return;
      }

      const { oldRepoId, newRepoId, reason } = migrationCheck;

      const userChoice = await this.migrationService.promptUserForMigration(oldRepoId, newRepoId, reason);

      if (userChoice === 'migrate') {
        await this.migrationService.performMigration(oldRepoId, newRepoId, workspacePath);
      } else if (userChoice === 'keep') {
        await this.identityStore.setManualIdentity(workspacePath, oldRepoId);
        vscode.window.showInformationMessage('Current identity preserved as manual override.');
      }

    } catch (error) {
      this.logger.error(`Error during manual migration: ${formatError(error)}`);
      vscode.window.showErrorMessage('Migration failed. Please try again.');
    }
  }

  /**
   * Show migration history for a workspace
   */
  private async showMigrationHistory(workspacePath: string): Promise<void> {
    const storedData = this.identityStore.getRepoIdentity(workspacePath);

    if (!storedData?.migrationHistory.length) {
      vscode.window.showInformationMessage('No migration history found for this workspace.');
      return;
    }

    const historyItems = storedData.migrationHistory
      .sort((a, b) => new Date(b.migratedAt).getTime() - new Date(a.migratedAt).getTime())
      .map(migration => ({
        label: `${migration.fromRepoId.substring(0, 8)}... → ${migration.toRepoId.substring(0, 8)}...`,
        description: new Date(migration.migratedAt).toLocaleString(),
        detail: `Reason: ${migration.reason}`
      }));

    const selection = await vscode.window.showQuickPick(historyItems, {
      placeHolder: 'Select migration to view details'
    });

    if (selection) {
      const fullMessage = `**Migration Details**\n\n` +
        `**From:** ${selection.label.split(' → ')[0].replace('...', '')}\n` +
        `**To:** ${selection.label.split(' → ')[1].replace('...', '')}\n` +
        `**Date:** ${selection.description}\n` +
        `**Reason:** ${selection.detail.replace('Reason: ', '')}`;

      vscode.window.showInformationMessage(fullMessage);
    }
  }

  /**
   * Diagnose repository detection and output comprehensive report
   */
  async diagnoseRepoDetection(): Promise<void> {
    const workspacePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!workspacePath) {
      vscode.window.showErrorMessage('No workspace is currently open.');
      return;
    }

    try {
      // Create output channel
      const outputChannel = vscode.window.createOutputChannel('EnvVal Repo Detection Diagnostics');
      outputChannel.show();

      outputChannel.appendLine('='.repeat(60));
      outputChannel.appendLine('ENVVAL REPOSITORY DETECTION DIAGNOSTICS');
      outputChannel.appendLine('='.repeat(60));
      outputChannel.appendLine(`Workspace Path: ${workspacePath}`);
      outputChannel.appendLine(`Timestamp: ${new Date().toISOString()}`);
      outputChannel.appendLine('');

      // Current identity detection
      outputChannel.appendLine('1. CURRENT IDENTITY DETECTION:');
      outputChannel.appendLine('-'.repeat(30));

      const identity = await getCurrentWorkspaceId(undefined, this.context);
      if (identity) {
        outputChannel.appendLine(`Repo ID: ${identity.repoId}`);
        outputChannel.appendLine(`Identity Source: ${identity.identitySource}`);
        outputChannel.appendLine(`Git Remote: ${identity.gitRemote || 'None'}`);
        if (identity.gitRemoteType) {
          outputChannel.appendLine(`Git Remote Type: ${identity.gitRemoteType}`);
        }
        outputChannel.appendLine(`Sub-Project Path: ${identity.subProjectPath || 'None'}`);
        outputChannel.appendLine(`Monorepo Detected: ${identity.monorepoDetected ? 'Yes' : 'No'}`);
        if (identity.availableSubProjects) {
          outputChannel.appendLine(`Available Sub-Projects: ${identity.availableSubProjects.join(', ')}`);
        }
        if (identity.requiresMigration) {
          outputChannel.appendLine(`Migration Required: Yes`);
          outputChannel.appendLine(`Suggested New ID: ${identity.suggestedMigration?.newRepoId}`);
          outputChannel.appendLine(`Migration Reason: ${identity.suggestedMigration?.reason}`);
        } else {
          outputChannel.appendLine(`Migration Required: No`);
        }
      } else {
        outputChannel.appendLine('ERROR: Unable to determine workspace identity');
      }
      outputChannel.appendLine('');

      // Stored identity data
      outputChannel.appendLine('2. STORED IDENTITY DATA:');
      outputChannel.appendLine('-'.repeat(30));

      const storedData = this.identityStore.getRepoIdentity(workspacePath);
      if (storedData) {
        outputChannel.appendLine(`Manual Identity: ${storedData.manualIdentity || 'None'}`);
        outputChannel.appendLine(`Sub-Project Path: ${storedData.subProjectPath || 'None'}`);
        outputChannel.appendLine(`Identity Source: ${storedData.identitySource}`);
        outputChannel.appendLine(`Created: ${storedData.createdAt}`);
        outputChannel.appendLine(`Last Updated: ${storedData.lastUpdatedAt}`);

        outputChannel.appendLine(`Git Remote History (${storedData.gitRemoteHistory.length} entries):`);
        for (const remote of storedData.gitRemoteHistory.slice(-3)) { // Show last 3
          outputChannel.appendLine(`  - ${remote.url} (${remote.normalizedUrl}) - ${remote.detectedAt}`);
        }

        outputChannel.appendLine(`Migration History (${storedData.migrationHistory.length} entries):`);
        for (const migration of storedData.migrationHistory.slice(-3)) { // Show last 3
          outputChannel.appendLine(`  - ${migration.fromRepoId.substring(0, 8)}... → ${migration.toRepoId.substring(0, 8)}... (${migration.migratedAt})`);
          outputChannel.appendLine(`    Reason: ${migration.reason}`);
        }
      } else {
        outputChannel.appendLine('No stored identity data found');
      }
      outputChannel.appendLine('');

      // Git analysis
      outputChannel.appendLine('3. GIT ANALYSIS:');
      outputChannel.appendLine('-'.repeat(30));


      try {
        const allRemotes = await getAllGitRemotes(workspacePath);
        outputChannel.appendLine(`Git Remotes Found: ${allRemotes.size}`);
        for (const [name, url] of allRemotes) {
          outputChannel.appendLine(`  ${name}: ${url}`);
        }
      } catch (error) {
        outputChannel.appendLine(`Git Remotes Error: ${error}`);
      }

      // Monorepo analysis
      try {
        const subProjects = await detectMonorepoStructure(workspacePath);
        outputChannel.appendLine(`Monorepo Sub-Projects Found: ${subProjects.length}`);
        if (subProjects.length > 0) {
          for (const subProject of subProjects.slice(0, 10)) { // Limit to first 10
            outputChannel.appendLine(`  - ${subProject}`);
          }
          if (subProjects.length > 10) {
            outputChannel.appendLine(`  ... and ${subProjects.length - 10} more`);
          }
        }
      } catch (error) {
        outputChannel.appendLine(`Monorepo Analysis Error: ${error}`);
      }

      outputChannel.appendLine('');

      // Configuration
      outputChannel.appendLine('4. CONFIGURATION:');
      outputChannel.appendLine('-'.repeat(30));

      const config = vscode.workspace.getConfiguration('envval');
      outputChannel.appendLine(`Auto-detect Monorepo: ${config.get('autoDetectMonorepo', true)}`);
      outputChannel.appendLine(`Preferred Remote: ${config.get('preferredRemote', 'origin')}`);
      outputChannel.appendLine(`Prompt for Migration: ${config.get('promptForMigration', true)}`);

      outputChannel.appendLine('');

      // Environment metadata
      outputChannel.appendLine('5. ENVIRONMENT METADATA:');
      outputChannel.appendLine('-'.repeat(30));

      try {
        const currentRepoId = identity?.repoId;
        if (currentRepoId) {
          const envCount = await this.getEnvCountForRepo(currentRepoId);
          outputChannel.appendLine(`Envs for Current Repo ID (${currentRepoId.substring(0, 8)}...): ${envCount}`);
        } else {
          outputChannel.appendLine('No current repo ID available');
        }
      } catch (error) {
        outputChannel.appendLine(`Metadata Analysis Error: ${error}`);
      }

      outputChannel.appendLine('');
      outputChannel.appendLine('='.repeat(60));
      outputChannel.appendLine('DIAGNOSTIC COMPLETE');
      outputChannel.appendLine('='.repeat(60));

    } catch (error) {
      this.logger.error(`Error during repo detection diagnostics: ${formatError(error)}`);
      vscode.window.showErrorMessage('Failed to generate diagnostic report.');
    }
  }

  /**
   * Get count of environment variables for a repo ID
   */
  private async getEnvCountForRepo(repoId: string): Promise<number> {
    try {
      const envs = await this.metadataStore.getEnvsByRepoId(repoId);
      return envs.length;
    } catch {
      return 0;
    }
  }
}