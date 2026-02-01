import * as vscode from 'vscode';

interface QuickPickOption {
	label: string;
	description?: string;
	value: string;
}

/**
 * Shows a modal quick pick that requires user selection.
 * Returns the selected value or undefined if cancelled.
 */
async function showModalQuickPick<T extends string>(
	title: string,
	placeholder: string,
	options: QuickPickOption[]
): Promise<T | undefined> {
	const result = await vscode.window.showQuickPick(options, {
		title,
		placeHolder: placeholder,
		ignoreFocusOut: true, // Prevents accidental dismissal
	});
	return result?.value as T | undefined;
}

export async function showInitPrompt(fileName: string): Promise<'initialize' | 'cancel'> {
	const result = await showModalQuickPick<'initialize' | 'cancel'>(
		'EnvVault: New Environment File',
		`Initialize ${fileName} with EnvVault?`,
		[
			{ label: '$(cloud-upload) Initialize', description: 'Start syncing this file', value: 'initialize' },
			{ label: '$(x) Cancel', description: 'Skip for now', value: 'cancel' },
		]
	);
	return result ?? 'cancel';
}

export async function showRestorePrompt(fileName: string): Promise<'restore' | 'cancel'> {
	const result = await showModalQuickPick<'restore' | 'cancel'>(
		'EnvVault: Remote File Found',
		`${fileName} exists remotely but not locally`,
		[
			{ label: '$(cloud-download) Restore', description: 'Download from EnvVault', value: 'restore' },
			{ label: '$(x) Cancel', description: 'Skip', value: 'cancel' },
		]
	);
	return result ?? 'cancel';
}

export async function showFirstTimeSyncPrompt(fileName: string): Promise<'useLocal' | 'useRemote' | 'cancel'> {
	const result = await showModalQuickPick<'useLocal' | 'useRemote' | 'cancel'>(
		'EnvVault: Version Conflict',
		`Both local and remote versions of ${fileName} exist`,
		[
			{ label: '$(file) Use Local', description: 'Keep local version, overwrite remote', value: 'useLocal' },
			{ label: '$(cloud) Use Remote', description: 'Download remote, overwrite local', value: 'useRemote' },
			{ label: '$(x) Cancel', description: 'Decide later', value: 'cancel' },
		]
	);
	return result ?? 'cancel';
}

export async function showZombiePrompt(fileName: string): Promise<'reinitialize' | 'deleteLocal' | 'skip'> {
	const result = await showModalQuickPick<'reinitialize' | 'deleteLocal' | 'skip'>(
		'EnvVault: Remote Environment Missing',
		`${fileName} was deleted from the server but still exists locally.`,
		[
			{ label: '$(cloud-upload) Re-initialize', description: 'Upload local version to server', value: 'reinitialize' },
			{ label: '$(trash) Delete Local', description: 'Remove local file', value: 'deleteLocal' },
			{ label: '$(history) Skip', description: 'Don\'t ask again for 24 hours', value: 'skip' },
		]
	);
	return result ?? 'skip';
}

export async function showRepoRegistrationPrompt(): Promise<'register' | 'skip'> {
	const result = await showModalQuickPick<'register' | 'skip'>(
		'EnvVault: Repository Setup',
		'Register this repository for syncing?',
		[
			{ label: '$(repo) Register', description: 'Enable EnvVault for this repo', value: 'register' },
			{ label: '$(circle-slash) Skip', description: 'Not now', value: 'skip' },
		]
	);
	return result ?? 'skip';
}

export async function showEmptyFileConfirmation(fileName: string): Promise<'yes' | 'no'> {
	const result = await showModalQuickPick<'yes' | 'no'>(
		'EnvVault: Empty File',
		`${fileName} is empty. Initialize anyway?`,
		[
			{ label: '$(check) Yes', description: 'Initialize empty file', value: 'yes' },
			{ label: '$(x) No', description: 'Cancel', value: 'no' },
		]
	);
	return result ?? 'no';
}

/** Show success notification with progress indicator */
export function showSuccess(message: string): void {
	vscode.window.withProgress(
		{
			location: vscode.ProgressLocation.Notification,
			title: `EnvVault: ${message}`,
			cancellable: false,
		},
		async () => {
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}
	);
}

/** Show error notification - stays until dismissed */
export function showError(message: string): void {
	vscode.window.showErrorMessage(`EnvVault: ${message}`, { modal: false });
}