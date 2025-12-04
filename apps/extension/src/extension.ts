// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { createLogger } from './utils/logger';
import { getLoggingVerbose, onConfigChange } from './lib/config';
import { Commands } from './commands';
import { StatusBar } from './ui/status-bar';
import { LoginWindow } from './ui/login-window';
import { EnvVaultVsCodeSecrets } from './utils/secrets';
import { AuthenticationProvider } from './providers/auth-provider';
import { EnvVaultApiClient } from './api/client';
import { EnvFileWatcher } from './watchers/env-file-watcher';
import { SyncManager } from './watchers/env-sync-manager';
import { EnvVaultMetadataStore } from './services/metadata-store';
import { EnvInitService } from './services/env-init';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	const logger = createLogger(context, getLoggingVerbose());
	const secrets = EnvVaultVsCodeSecrets.getInstance(context);
	const authProvider = AuthenticationProvider.getInstance(secrets, logger);
	const apiClient = EnvVaultApiClient.getInstance(authProvider, logger);
	const metadataStore = EnvVaultMetadataStore.getInstance(context);
	const envFileWatcher = EnvFileWatcher.getInstance(context);
	const envInitService = EnvInitService.getInstance(metadataStore, apiClient, secrets, logger);
	const syncManager = SyncManager.getInstance(apiClient, secrets, metadataStore, envFileWatcher, envInitService, logger);
	
	logger.info('EnvVault extension is now active!');
	
	Commands.getInstance().registerCommands(context);

	const disposeConfigListener = onConfigChange((config: any) => {
		logger.setVerbose(config.loggingVerbose);
	});

	// Function to start all services (only when authenticated)
	const startServices = async () => {
		logger.info('Starting EnvVault services...');
		
		// Start file watcher
		envFileWatcher.start();
		
		// Perform initial check for existing env files
		await envInitService.performInitialCheck();
		
		// Start polling for remote changes
		syncManager.startPolling();
		
		logger.info('EnvVault services started');
	};

	// Function to stop all services (when logged out)
	const stopServices = () => {
		logger.info('Stopping EnvVault services...');
		
		// Stop polling
		syncManager.stopPolling();
		
		// Stop file watcher (but keep emitters for restart)
		envFileWatcher.stop();
		
		logger.info('EnvVault services stopped');
	};

	// Check authentication status
	const isAuthenticated = await authProvider.isAuthenticated();
	
	if (!isAuthenticated) {
		// Show login window if not authenticated
		const loginWindow = LoginWindow.getInstance(context, authProvider, logger);
		await loginWindow.show();
		
		// Listen for auth state changes
		authProvider.onAuthenticationStateChanged(async (authenticated) => {
			if (authenticated) {
				// User logged in - start all services
				await startServices();
				loginWindow.dispose();
			} else {
				// User logged out - stop all services
				stopServices();
			}
		});
	} else {
		// Already authenticated - start services immediately
		await startServices();
		
		// Listen for auth state changes (e.g., logout)
		authProvider.onAuthenticationStateChanged(async (authenticated) => {
			if (!authenticated) {
				stopServices();
			}
		});
	}

	context.subscriptions.push(
		disposeConfigListener, 
		StatusBar.getStatusBarItem(), 
		EnvFileWatcher.getInstance(context)
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
