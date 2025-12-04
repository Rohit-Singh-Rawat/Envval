import * as vscode from 'vscode';

export async function showInitPrompt(fileName: string): Promise<'initialize' | 'cancel'> {
  const result = await vscode.window.showInformationMessage(
    `New environment file detected: ${fileName}. Would you like to initialize it with EnvVault?`,
    'Initialize',
    'Cancel'
  );

  return result === 'Initialize' ? 'initialize' : 'cancel';
}

export async function showRestorePrompt(fileName: string): Promise<'restore' | 'cancel'> {
  const result = await vscode.window.showInformationMessage(
    `Environment file ${fileName} exists remotely but not locally. Would you like to restore it?`,
    'Restore',
    'Cancel'
  );

  return result === 'Restore' ? 'restore' : 'cancel';
}

export async function showFirstTimeSyncPrompt(fileName: string): Promise<'useLocal' | 'useRemote' | 'cancel'> {
  const result = await vscode.window.showWarningMessage(
    `Both local and remote versions of ${fileName} exist. Which version would you like to keep?`,
    'Use Local',
    'Use Remote',
    'Cancel'
  );

  if (result === 'Use Local') {
    return 'useLocal';
  } else if (result === 'Use Remote') {
    return 'useRemote';
  }
  return 'cancel';
}

/**
 * Prompt user to register repository with EnvVault
 */
export async function showRepoRegistrationPrompt(): Promise<'register' | 'skip'> {
  const result = await vscode.window.showInformationMessage(
    'EnvVault: Register this repository for syncing?',
    { modal: false },
    'Register',
    'Skip'
  );

  return result === 'Register' ? 'register' : 'skip';
}

/**
 * Confirm if user wants to initialize an empty env file
 */
export async function showEmptyFileConfirmation(fileName: string): Promise<'yes' | 'no'> {
  const result = await vscode.window.showWarningMessage(
    `${fileName} is empty. Initialize anyway?`,
    { modal: true },
    'Yes',
    'No'
  );

  return result === 'Yes' ? 'yes' : 'no';
}

/**
 * Show success notification
 */
export function showSuccess(message: string): void {
  vscode.window.showInformationMessage(`EnvVault: ${message}`);
}

/**
 * Show error notification
 */
export function showError(message: string): void {
  vscode.window.showErrorMessage(`EnvVault: ${message}`);
}