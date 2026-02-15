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
import { RepoIdentityCommands } from './commands/repo-identity';
import { TrackedEnvsProvider } from './views/tracked-envs';
import { EnvCacheService } from './services/env-cache';
import { EnvStatusCalculator } from './services/env-status-calculator';
import { EnvHoverProvider, SUPPORTED_LANGUAGES } from './providers/env-hover-provider';
import { ConnectionMonitor } from './services/connection-monitor';
import { OperationQueueService } from './services/operation-queue';
import { NOTIFICATION_DEBOUNCE_MS } from './lib/constants';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	const logger = createLogger(context, getLoggingVerbose());
	const statusBar = StatusBar.getInstance();
	const secrets = EnvVaultVsCodeSecrets.getInstance(context);
	const authProvider = AuthenticationProvider.getInstance(secrets, logger);
	const apiClient = EnvVaultApiClient.getInstance(authProvider, logger);
	const metadataStore = EnvVaultMetadataStore.getInstance(context);
	const envFileWatcher = EnvFileWatcher.getInstance(context, logger);
	const connectionMonitor = ConnectionMonitor.getInstance(logger);
	const operationQueue = OperationQueueService.getInstance(context, logger);

	// Initialize env cache and hover provider (works without authentication)
	const envCache = EnvCacheService.getInstance(envFileWatcher, logger);
	const hoverProvider = new EnvHoverProvider(envCache, logger);
	const hoverDisposable = vscode.languages.registerHoverProvider(
		SUPPORTED_LANGUAGES.map(lang => ({ scheme: 'file', language: lang })),
		hoverProvider
	);

	const envInitService = EnvInitService.getInstance(
		context,
		metadataStore,
		apiClient,
		secrets,
		logger
	);

	const repoIdentityCommands = new RepoIdentityCommands(context, metadataStore, logger);

	const syncManager = SyncManager.getInstance(
		context,
		apiClient,
		secrets,
		metadataStore,
		envFileWatcher,
		envInitService,
		logger
	);

	logger.info('EnvVault extension is now active!');

	Commands.getInstance().registerCommands(context);
	Commands.getInstance().registerHandlers(context, authProvider, syncManager, repoIdentityCommands, logger);

	// Initialize status calculator for tree view
	const statusCalculator = EnvStatusCalculator.getInstance(logger);
	const trackedEnvsProvider = new TrackedEnvsProvider(
		metadataStore,
		envFileWatcher,
		statusCalculator,
		logger
	);
	vscode.window.registerTreeDataProvider('envvalTrackedEnvs', trackedEnvsProvider);

	vscode.commands.registerCommand('envval.refreshTrackedEnvs', () => {
		trackedEnvsProvider.refresh();
	});

	const disposeConfigListener = onConfigChange((config) => {
		logger.setVerbose(config.loggingVerbose);
	});

	// Throttle connection notifications to prevent spam
	let lastNotificationAt = 0;

	connectionMonitor.onDidChangeDetailedState((state) => {
		statusBar.setConnectionState(state);
		vscode.commands.executeCommand('setContext', 'envval:offline', state !== 'online');
	});

	connectionMonitor.onDidChangeConnectionState(async (online) => {
		const now = Date.now();
		const canNotify = now - lastNotificationAt > NOTIFICATION_DEBOUNCE_MS;

		if (online) {
			apiClient.resetCircuitBreaker();
			await syncManager.processQueuedOperations();

			if (canNotify && !operationQueue.isEmpty) {
				lastNotificationAt = now;
			}
		} else {
			if (canNotify) {
				vscode.window.showWarningMessage('EnvVault: Connection lost. Changes will be queued.');
				lastNotificationAt = now;
			}
		}
	});

	// Function to start all services (only when authenticated)
	const startServices = async () => {
		logger.info('Starting EnvVault services...');
		envFileWatcher.start();
		connectionMonitor.start();
		await envInitService.performInitialCheck();
		syncManager.startPolling();
		trackedEnvsProvider.refresh();
		logger.info('EnvVault services started');
	};

	// Function to stop all services (when logged out)
	const stopServices = () => {
		logger.info('Stopping EnvVault services...');
		syncManager.stopPolling();
		connectionMonitor.stop();
		envFileWatcher.stop();
		operationQueue.clear();
		logger.info('EnvVault services stopped');
	};

	// Check authentication status
	const isAuthenticated = await authProvider.isAuthenticated();
	vscode.commands.executeCommand('setContext', 'envval:authenticated', isAuthenticated);
	vscode.commands.executeCommand('setContext', 'envval:unauthenticated', !isAuthenticated);

	if (!isAuthenticated) {
		statusBar.setAuthenticationState(false);
		const loginWindow = LoginWindow.getInstance(context, authProvider, logger);
		await loginWindow.show();

		authProvider.onAuthenticationStateChanged(async (authenticated) => {
			vscode.commands.executeCommand('setContext', 'envval:authenticated', authenticated);
			vscode.commands.executeCommand('setContext', 'envval:unauthenticated', !authenticated);
			if (authenticated) {
				await startServices();
				statusBar.setAuthenticationState(true);
				loginWindow.dispose();
			} else {
				stopServices();
				syncManager.invalidateCache();
				statusBar.setAuthenticationState(false);
				trackedEnvsProvider.refresh();
			}
		});
	} else {
		statusBar.setAuthenticationState(true);
		await startServices();

		authProvider.onAuthenticationStateChanged(async (authenticated) => {
			vscode.commands.executeCommand('setContext', 'envval:authenticated', authenticated);
			vscode.commands.executeCommand('setContext', 'envval:unauthenticated', !authenticated);
			if (!authenticated) {
				stopServices();
				syncManager.invalidateCache();
				statusBar.setAuthenticationState(false);
				trackedEnvsProvider.refresh();
			}
		});
	}

	context.subscriptions.push(
		disposeConfigListener,
		statusBar,
		authProvider,
		envFileWatcher,
		syncManager,
		connectionMonitor,
		operationQueue,
		envCache,
		hoverDisposable
	);
}

export function deactivate() {
	// VS Code disposes of all subscriptions in context.subscriptions automatically
	// This includes our singleton instances that implement Disposable
}
