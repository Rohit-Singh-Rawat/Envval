import * as vscode from 'vscode';
import { RepoIdentityStore } from './repo-identity-store';
import { EnvvalMetadataStore } from './metadata-store';
import { EnvvalApiClient } from '../api/client';
import { getCurrentWorkspaceId, getGitRemoteUrl } from '../utils/repo-detection';
import type { Logger } from '../utils/logger';
import { formatError } from '../utils/format-error';

/**
 * Service for handling repo identity migrations when Git remotes are detected
 * or when users manually change repo identities.
 */
export class RepoMigrationService {
	constructor(
		private context: vscode.ExtensionContext,
		private metadataStore: EnvvalMetadataStore,
		private identityStore: RepoIdentityStore,
		private apiClient: EnvvalApiClient,
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
			const identity = await getCurrentWorkspaceId(undefined, this.context, this.logger);

			if (!identity || !identity.requiresMigration || !identity.suggestedMigration) {
				return { needsMigration: false };
			}

			return {
				needsMigration: true,
				oldRepoId: identity.suggestedMigration.oldRepoId,
				newRepoId: identity.suggestedMigration.newRepoId,
				reason: identity.suggestedMigration.reason,
			};
		} catch (error) {
			this.logger.error(`Error detecting migration need: ${formatError(error)}`);
			return { needsMigration: false };
		}
	}

	/**
	 * Prompt user for migration decision
	 */
	async promptUserForMigration(
		oldRepoId: string,
		newRepoId: string,
		reason: string
	): Promise<'migrate' | 'later' | 'keep' | 'cancel'> {
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
	async performMigration(
		oldRepoId: string,
		newRepoId: string,
		workspacePath: string
	): Promise<{ success: boolean; migratedCount: number }> {
		try {
			this.logger.info(`Starting migration from ${oldRepoId} to ${newRepoId}`);

			// Migrate metadata store entries
			const migratedCount = await this.metadataStore.migrateRepoId(oldRepoId, newRepoId);

			// Update identity store with migration record
			await this.identityStore.migrateRepoId(oldRepoId, newRepoId, 'user-initiated');

			// Update last active repo ID to prevent re-detection of migration needed
			await this.identityStore.updateLastActiveRepoId(workspacePath, newRepoId);

			try {
				const gitRemoteUrl = await getGitRemoteUrl(workspacePath);

				const result = await this.apiClient.migrateRepo(oldRepoId, newRepoId, gitRemoteUrl);
				if (!result.success) {
					vscode.window.showWarningMessage(
						`Local migration successful, but server sync failed: ${result.message}`
					);
				}
			} catch (error) {
				this.logger.warn(`Server migration failed: ${formatError(error)}`);
				vscode.window.showWarningMessage(
					'Local migration successful, but server sync failed. Please check your connection.'
				);
			}

			this.logger.info(`Successfully migrated ${migratedCount} metadata entries`);

			// Show success message
			vscode.window.showInformationMessage(
				`Successfully migrated repository identity. ${migratedCount} environment variable entries updated.`
			);

			return { success: true, migratedCount };
		} catch (error) {
			this.logger.error(`Migration failed: ${formatError(error)}`);
			vscode.window.showErrorMessage('Repository identity migration failed. Please try again.');

			return { success: false, migratedCount: 0 };
		}
	}

	/**
	 * Handle automatic migration prompt based on configuration
	 */
	async handleAutomaticMigrationPrompt(workspacePath: string): Promise<boolean> {
		const config = vscode.workspace.getConfiguration('envval');
		const shouldPrompt = config.get('promptForMigration', true);

		if (!shouldPrompt) {
			return false;
		}

		const migrationCheck = await this.detectMigrationNeeded(workspacePath);
		if (
			!migrationCheck.needsMigration ||
			!migrationCheck.oldRepoId ||
			!migrationCheck.newRepoId ||
			!migrationCheck.reason
		) {
			return false;
		}

		const { oldRepoId, newRepoId, reason } = migrationCheck;

		const userChoice = await this.promptUserForMigration(oldRepoId, newRepoId, reason);

		switch (userChoice) {
			case 'migrate':
				await this.performMigration(oldRepoId, newRepoId, workspacePath);
				return true;
			case 'keep':
				// Set manual override to keep current identity
				await this.identityStore.setManualIdentity(workspacePath, oldRepoId);
				return false;
			case 'later':
				// Do nothing, user will be prompted again later
				return false;
			case 'cancel':
				// Do nothing
				return false;
		}
		return false;
	}
}
