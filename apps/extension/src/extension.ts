import * as vscode from 'vscode';
import { createLogger } from './utils/logger';
import { getRuntimeConfig, onConfigChange } from './lib/config';
import { Commands } from './commands';
import { StatusBar } from './ui/status-bar';
import { LoginWindow } from './ui/login-window';
import { EnvvalVsCodeSecrets } from './utils/secrets';
import { AuthenticationProvider } from './providers/auth-provider';
import { EnvvalApiClient } from './api/client';
import { EnvFileWatcher } from './watchers/env-file-watcher';
import { SyncManager } from './watchers/env-sync-manager';
import { EnvvalMetadataStore } from './services/metadata-store';
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

export async function activate(context: vscode.ExtensionContext) {
	const logger = createLogger(context, getRuntimeConfig());

	const workspaceValidator = WorkspaceValidator.getInstance(logger);
	const contextProvider = WorkspaceContextProvider.getInstance();

	const statusBar = StatusBar.getInstance();
	const secrets = EnvvalVsCodeSecrets.getInstance(context);
	const authProvider = AuthenticationProvider.getInstance(secrets, logger);
	const apiClient = EnvvalApiClient.getInstance(authProvider, logger);
	const metadataStore = EnvvalMetadataStore.getInstance(context);
	const envFileWatcher = EnvFileWatcher.getInstance(context, logger);
	const connectionMonitor = ConnectionMonitor.getInstance(logger);
	const operationQueue = OperationQueueService.getInstance(context, logger);

	const envCache = EnvCacheService.getInstance(envFileWatcher, logger);
	const hoverProvider = new EnvHoverProvider(envCache, logger);
	const hoverDisposable = vscode.languages.registerHoverProvider(
		SUPPORTED_LANGUAGES.map((lang) => ({ scheme: 'file', language: lang })),
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

	logger.info('Envval extension is now active!');

	Commands.getInstance().registerCommands(context);
	Commands.getInstance().registerHandlers(
		context,
		authProvider,
		syncManager,
		repoIdentityCommands,
		envInitService,
		logger
	);

	const statusCalculator = EnvStatusCalculator.getInstance(logger);
	const trackedEnvsProvider = new TrackedEnvsProvider(
		metadataStore,
		envFileWatcher,
		statusCalculator,
		logger
	);
	vscode.window.registerTreeDataProvider('envvalTrackedEnvs', trackedEnvsProvider);

	context.subscriptions.push(
		vscode.commands.registerCommand('envval.refreshTrackedEnvs', () => {
			trackedEnvsProvider.refresh();
		}),
		vscode.commands.registerCommand('envval.validateWorkspace', async () => {
			const wsContext = contextProvider.getWorkspaceContext();
			if (wsContext.primaryPath) {
				workspaceValidator.clearCache(wsContext.primaryPath);
				const result = await workspaceValidator.validateWorkspace(wsContext.primaryPath, {
					showPrompts: true,
					force: true,
				});
				if (result.canProceed) {
					vscode.window.showInformationMessage(
						'Workspace validation passed. Safe to scan for environment files.'
					);
				}
			} else {
				vscode.window.showWarningMessage('No workspace open');
			}
		})
	);

	const disposeConfigListener = onConfigChange((config) => {
		logger.setRuntimeConfig(config);
	});

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
				vscode.window.showWarningMessage('Envval: Connection lost. Changes will be queued.');
				lastNotificationAt = now;
			}
		}
	});

	const startServices = async () => {
		logger.info('Starting Envval services...');
		envFileWatcher.start();
		connectionMonitor.start();
		await envInitService.performInitialCheck();
		syncManager.startPolling();
		trackedEnvsProvider.refresh();
		logger.info('Envval services started');
	};

	const stopServices = () => {
		logger.info('Stopping Envval services...');
		syncManager.stopPolling();
		connectionMonitor.stop();
		envFileWatcher.stop();
		// Do NOT clear the operation queue here. Queued offline changes must
		// survive a logout so they can be replayed when the user signs back in.
		logger.info('Envval services stopped');
	};

	const loginWindow = LoginWindow.getInstance(context, authProvider, logger);

	const isAuthenticated = await authProvider.isAuthenticated();
	vscode.commands.executeCommand('setContext', 'envval:authenticated', isAuthenticated);
	vscode.commands.executeCommand('setContext', 'envval:unauthenticated', !isAuthenticated);

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
		hoverDisposable,
		trackedEnvsProvider
	);
}

export function deactivate(): void {
	// Cleanup handled via context.subscriptions disposal
}
