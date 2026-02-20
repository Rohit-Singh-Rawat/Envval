import * as vscode from 'vscode';
import * as path from 'path';
import { isPathSafe, type PathSafetyResult } from '../utils/path-safety';
import { WORKSPACE_VALIDATION_CACHE_TTL_MS } from '../lib/workspace-limits';
import type { Logger } from '../utils/logger';

export interface ValidationResult {
	isValid: boolean;
	canProceed: boolean;
	warnings: string[];
	workspacePath: string;
	validationTime: number;
}

/**
 * Validates workspace paths for safety before file scanning.
 * Prevents users from accidentally opening overly broad directories (Desktop, C:\, entire drives, etc.)
 * that would result in scanning thousands of unrelated files.
 *
 * Note: VS Code's native findFiles API handles performance optimization for large workspaces,
 * so this validator only focuses on preventing obviously problematic workspace selections.
 *
 * Implements caching to avoid re-validating the same workspace repeatedly.
 */
export class WorkspaceValidator {
	private static instance: WorkspaceValidator;
	private readonly logger: Logger;
	private readonly validationCache: Map<string, { result: ValidationResult; timestamp: number }>;
	private statusBarItem: vscode.StatusBarItem | undefined;

	private constructor(logger: Logger) {
		this.logger = logger;
		this.validationCache = new Map();
	}

	public static getInstance(logger: Logger): WorkspaceValidator {
		if (!WorkspaceValidator.instance) {
			WorkspaceValidator.instance = new WorkspaceValidator(logger);
		}
		return WorkspaceValidator.instance;
	}

	/**
	 * Validates workspace path for safety before scanning.
	 * Focuses on preventing users from opening overly broad directories (Desktop, C:\, etc.)
	 * that would cause poor performance. VS Code's native findFiles handles the actual scanning efficiently.
	 */
	public async validateWorkspace(
		workspacePath: string,
		options: { showPrompts?: boolean; force?: boolean } = {}
	): Promise<ValidationResult> {
		const { showPrompts = true, force = false } = options;
		const startTime = Date.now();

		// Check cache unless force refresh requested
		if (!force) {
			const cached = this.validationCache.get(workspacePath);
			if (cached && Date.now() - cached.timestamp < WORKSPACE_VALIDATION_CACHE_TTL_MS) {
				this.logger.debug(`Using cached validation for ${workspacePath}`);
				return cached.result;
			}
		}

		this.logger.info(`Validating workspace path safety: ${workspacePath}`);
		const warnings: string[] = [];

		// Path safety check - prevent scanning overly broad directories
		const safetyResult = isPathSafe(workspacePath, {}, this.logger);
		if (!safetyResult.isSafe) {
			this.logger.warn(`Unsafe path detected: ${workspacePath} (${safetyResult.reason})`);

			if (showPrompts) {
				const userConfirmed = await this.showUnsafePathWarning(workspacePath, safetyResult);
				if (!userConfirmed) {
					const result: ValidationResult = {
						isValid: false,
						canProceed: false,
						warnings: [`Unsafe workspace path: ${safetyResult.suggestedAction}`],
						workspacePath,
						validationTime: Date.now() - startTime,
					};
					this.cacheResult(workspacePath, result);
					this.updateStatusBar(result);
					return result;
				}
				// User chose to proceed anyway - add warning but allow
				warnings.push(`Warning: ${safetyResult.suggestedAction}`);
			} else {
				warnings.push(`Warning: ${safetyResult.suggestedAction}`);
			}
		}

		// Validation passed
		const result: ValidationResult = {
			isValid: true,
			canProceed: true,
			warnings,
			workspacePath,
			validationTime: Date.now() - startTime,
		};

		this.logger.info(`Validation completed in ${result.validationTime}ms`);
		this.cacheResult(workspacePath, result);
		this.updateStatusBar(result);

		return result;
	}

	/**
	 * Validates workspace and prompts user if needed. Returns true if scan can proceed.
	 * Simplified wrapper around validateWorkspace for common use case.
	 */
	public async validateAndPromptIfNeeded(workspacePath: string): Promise<boolean> {
		const result = await this.validateWorkspace(workspacePath, { showPrompts: true });
		return result.canProceed;
	}

	/**
	 * Clears validation cache for a specific workspace or all workspaces.
	 */
	public clearCache(workspacePath?: string): void {
		if (workspacePath) {
			this.validationCache.delete(workspacePath);
			this.logger.debug(`Cleared validation cache for ${workspacePath}`);
		} else {
			this.validationCache.clear();
			this.logger.debug('Cleared all validation cache');
		}
	}

	/**
	 * Updates status bar with validation result (passive feedback).
	 * Only shows warnings for unsafe workspace paths.
	 */
	private updateStatusBar(result: ValidationResult): void {
		if (!this.statusBarItem) {
			this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
		}

		const folderName = path.basename(result.workspacePath);

		if (!result.isValid || !result.canProceed) {
			// Unsafe workspace - show warning in status bar
			this.statusBarItem.text = `$(warning) Envval: Unsafe workspace`;
			this.statusBarItem.tooltip = `Workspace "${folderName}" is not recommended for Envval.\nClick to validate again.`;
			this.statusBarItem.command = 'envval.validateWorkspace';
			this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
			this.statusBarItem.show();
		} else {
			// Valid workspace - show checkmark briefly then hide
			this.statusBarItem.text = `$(check) Envval: Ready`;
			this.statusBarItem.tooltip = `Workspace validated successfully`;
			this.statusBarItem.backgroundColor = undefined;
			this.statusBarItem.show();

			// Hide after 2 seconds
			setTimeout(() => {
				if (this.statusBarItem) {
					this.statusBarItem.hide();
				}
			}, 2000);
		}
	}

	/**
	 * Shows modal warning for unsafe workspace paths (Desktop, C:\, etc.)
	 * For critical paths (root drives, system dirs), blocks completely.
	 * For user folders (Desktop, Documents), offers to open correct folder.
	 */
	private async showUnsafePathWarning(
		workspacePath: string,
		safetyResult: PathSafetyResult
	): Promise<boolean> {
		const folderName = path.basename(workspacePath);
		const reasonText = this.getReasonText(safetyResult.reason);

		// Critical paths: Block completely, no option to continue
		if (safetyResult.reason === 'root_drive' || safetyResult.reason === 'system_directory') {
			const result = await vscode.window.showErrorMessage(
				`Envval: Cannot Use ${reasonText}`,
				{
					modal: true,
					detail: `You've opened "${folderName}" as a workspace.\n\nEnvval cannot scan ${reasonText} for security and performance reasons.\n\nPlease:\n1. Open a specific project folder instead\n2. Avoid opening system directories\n\nExample: Open "C:\\Projects\\MyApp" instead of "C:\\"`,
				},
				'Open Project Folder',
				'Close'
			);

			if (result === 'Open Project Folder') {
				// Open folder picker
				await vscode.commands.executeCommand('vscode.openFolder');
			}

			return false; // Never allow root drives/system dirs
		}

		// User folders (Desktop, Documents): Strongly discourage but allow with warning
		const result = await vscode.window.showWarningMessage(
			`Envval: Unsafe Workspace Location`,
			{
				modal: true,
				detail: `You've opened "${folderName}" (${reasonText}) as a workspace.\n\nEnvval works best with specific project folders.\n\nScanning "${folderName}" may:\n• Take 30-60 seconds on startup\n• Slow down VS Code\n• Find unrelated .env files\n• Drain laptop battery\n\nRecommended: Open your project folder directly.`,
			},
			'Open Project Folder',
			'Scan Anyway (Not Recommended)',
			'Cancel'
		);

		if (result === 'Open Project Folder') {
			// Open folder picker
			await vscode.commands.executeCommand('vscode.openFolder');
			return false;
		}

		return result === 'Scan Anyway (Not Recommended)';
	}

	/**
	 * Caches validation result with timestamp
	 */
	private cacheResult(workspacePath: string, result: ValidationResult): void {
		this.validationCache.set(workspacePath, {
			result,
			timestamp: Date.now(),
		});
	}

	/**
	 * Converts safety reason enum to user-friendly text
	 */
	private getReasonText(reason?: string): string {
		switch (reason) {
			case 'root_drive':
				return 'entire drive';
			case 'user_home_top':
				return 'home directory';
			case 'user_home_subdir':
				return 'user folder';
			case 'system_directory':
				return 'system directory';
			default:
				return 'potentially unsafe location';
		}
	}
}
