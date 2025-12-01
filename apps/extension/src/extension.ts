// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { createLogger } from './lib/logger';
import { getLoggingVerbose, onConfigChange } from './lib/config';
import { Commands } from './lib/commands';
import { StatusBar } from './lib/status-bar';
import { EnvVaultVsCodeSecrets } from './lib/secrets';
import { AuthenticationProvider } from './authentication/auth-provider';
import { EnvVaultApiClient } from './api/client';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const logger = createLogger(context, getLoggingVerbose());
	const secrets = EnvVaultVsCodeSecrets.getInstance(context);
	const authProvider = AuthenticationProvider.getInstance(secrets, logger);
	const apiClient = EnvVaultApiClient.getInstance(authProvider, logger);
	logger.info('EnvVault extension is now active!');
	Commands.getInstance().registerCommands(context);

	const disposeConfigListener = onConfigChange(config => {
			logger.setVerbose(config.loggingVerbose);
		});

	context.subscriptions.push(disposeConfigListener, StatusBar.getStatusBarItem());
}

// This method is called when your extension is deactivated
export function deactivate() {}
