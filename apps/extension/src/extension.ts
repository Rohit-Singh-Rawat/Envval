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
import { WorkspaceValidator } from './services/workspace-validator';
import { WorkspaceContextProvider } from './services/workspace-context-provider';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
	const logger = createLogger(context, getLoggingVerbose());

	// Initialize workspace components early for validation
	const workspaceValidator = WorkspaceValidator.getInstance(logger);
	const contextProvider = WorkspaceContextProvider.getInstance();

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
	Commands.getInstance().registerHandlers(context, authProvider, syncManager, repoIdentityCommands, envInitService, logger);

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

	// Command to manually re-validate workspace
	vscode.commands.registerCommand('envval.validateWorkspace', async () => {
		const wsContext = contextProvider.getWorkspaceContext();
		if (wsContext.primaryPath) {
			workspaceValidator.clearCache(wsContext.primaryPath);
			const result = await workspaceValidator.validateWorkspace(
				wsContext.primaryPath,
				{ showPrompts: true, force: true }
			);
			if (result.canProceed) {
				vscode.window.showInformationMessage(
					`Workspace validation passed. Safe to scan for environment files.`
				);
			}
		} else {
			vscode.window.showWarningMessage('No workspace open');
		}
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

	// Initialize LoginWindow eagerly so it's available for auto-logout
	const loginWindow = LoginWindow.getInstance(context, authProvider, logger);

	// Check authentication status
	const isAuthenticated = await authProvider.isAuthenticated();
	vscode.commands.executeCommand('setContext', 'envval:authenticated', isAuthenticated);
	vscode.commands.executeCommand('setContext', 'envval:unauthenticated', !isAuthenticated);

	// Single auth state handler for both initial states
	authProvider.onAuthenticationStateChanged(async (authenticated) => {
		vscode.commands.executeCommand('setContext', 'envval:authenticated', authenticated);
		vscode.commands.executeCommand('setContext', 'envval:unauthenticated', !authenticated);

		if (authenticated) {
			loginWindow.dispose();
			statusBar.setAuthenticationState(true);
			await startServices();
		} else {
			stopServices();
			syncManager.invalidateCache();
			statusBar.setAuthenticationState(false);
			trackedEnvsProvider.refresh();
			await loginWindow.show();
		}
	});

	if (!isAuthenticated) {
		statusBar.setAuthenticationState(false);
		await loginWindow.show();
	} else {
		statusBar.setAuthenticationState(true);
		await startServices();
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

/**
 * Extension deactivation lifecycle hook.
 *
 * Ensures clean shutdown of all services to prevent:
 * - Memory leaks from active intervals/timers
 * - Orphaned file system watchers
 * - Dangling event listeners
 *
 * Note: VS Code automatically disposes context.subscriptions,
 * but explicit cleanup ensures deterministic shutdown order.
 */
export function deactivate(): void {
	// No-op: All cleanup is handled via context.subscriptions disposal
	// The subscription array ensures proper cleanup order:
	// 1. Config listener
	// 2. StatusBar (disposes status bar item)
	// 3. AuthProvider (clears auth state listeners)
	// 4. EnvFileWatcher (stops file system watchers)
	// 5. SyncManager (stops polling interval)
	// 6. ConnectionMonitor (stops network checks)
	// 7. OperationQueue (clears pending operations)
	// 8. EnvCache (clears cache)
	// 9. Hover provider (unregisters hover handler)
}
