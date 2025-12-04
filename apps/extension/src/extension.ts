// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { createLogger } from './utils/logger';
import { getLoggingVerbose, onConfigChange } from './lib/config';
import { Commands } from './commands';
import { StatusBar } from './ui/status-bar';
import { EnvVaultVsCodeSecrets } from './utils/secrets';
import { AuthenticationProvider } from './providers/auth-provider';
import { EnvVaultApiClient } from './api/client';
import { EnvFileWatcher } from './watchers/env-file-watcher';
import { SyncManager } from './watchers/env-sync-manager';
import { EnvVaultMetadataStore } from './services/metadata-store';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const logger = createLogger(context, getLoggingVerbose());
	const secrets = EnvVaultVsCodeSecrets.getInstance(context);
	const authProvider = AuthenticationProvider.getInstance(secrets, logger);
	const apiClient = EnvVaultApiClient.getInstance(authProvider, logger);
	const metadataStore = EnvVaultMetadataStore.getInstance(context);
	const envFileWatcher = EnvFileWatcher.getInstance(context);
	const syncManager = SyncManager.getInstance(apiClient, secrets, metadataStore, envFileWatcher, logger);	envFileWatcher.start();
	logger.info('EnvVault extension is now active!');
	Commands.getInstance().registerCommands(context);

	const disposeConfigListener = onConfigChange((config: any) => {
			logger.setVerbose(config.loggingVerbose);
		});

	context.subscriptions.push(disposeConfigListener, StatusBar.getStatusBarItem(), EnvFileWatcher.getInstance(context));
}

// This method is called when your extension is deactivated
export function deactivate() {}
