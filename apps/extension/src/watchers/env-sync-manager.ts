import { encryptEnv, hashEnv, decryptEnv, countEnvVars, deriveKeyAsync } from '../utils/crypto';
import { getRepoAndEnvIds, getWorkspacePath } from '../utils/repo-detection';
import { getVSCodeConfig } from '../lib/config';
import { Logger } from '../utils/logger';
import * as vscode from 'vscode';
import { Uri, WorkspaceEdit, Range, window, Disposable } from 'vscode';
import { EnvvalApiClient, ApiError } from '../api/client';
import { EnvvalMetadataStore } from '../services/metadata-store';
import { EnvFileWatcher } from './env-file-watcher';
import { EnvInitService } from '../services/env-init';
import fs from 'fs';
import path from 'path';
import { EnvvalVsCodeSecrets } from '../utils/secrets';
import { IGNORE_INTERVAL_MS, MAX_ENV_FILE_SIZE_BYTES } from '../lib/constants';
import { validateFilePath, toWorkspaceRelativePath } from '../utils/path-validator';
import { StatusBar } from '../ui/status-bar';
import { ConnectionMonitor } from '../services/connection-monitor';
import { OperationQueueService } from '../services/operation-queue';
import { formatError } from '../utils/format-error';

/**
 * Service orchestrating the synchronization between local files and Envval.
 * Handles watchers, background polling, and conflict resolution.
 */
export class SyncManager implements Disposable {
	private static instance: SyncManager;
	private pollInterval?: NodeJS.Timeout;
	private readonly context: vscode.ExtensionContext;
	private readonly apiClient: EnvvalApiClient;
	private readonly secretsManager: EnvvalVsCodeSecrets;
	private readonly metadataStore: EnvvalMetadataStore;
	private readonly envInitService: EnvInitService;
	private readonly logger: Logger;

	/**
	 * Memory cache for the derived AES key to avoid CPU-intensive PBKDF2 on every operation.
	 */
	private cachedKey: string | null = null;

	/**
	 * Track in-flight syncs to prevent race conditions (e.g., Save vs Poll).
	 */
	private readonly activeSyncs: Set<string> = new Set();

	/**
	 * Coalesces rapid saves: if a sync is active for an envId, the latest
	 * incoming URI is stored here and processed once the current sync finishes.
	 * Only the most recent pending save is kept — intermediate ones are dropped
	 * since we always want to upload the final state.
	 */
	private readonly pendingSyncs: Map<string, Uri> = new Map();

	private constructor(
		context: vscode.ExtensionContext,
		apiClient: EnvvalApiClient,
		secretsManager: EnvvalVsCodeSecrets,
		metadataStore: EnvvalMetadataStore,
		envFileWatcher: EnvFileWatcher,
		envInitService: EnvInitService,
		logger: Logger
	) {
		this.context = context;
		this.apiClient = apiClient;
		this.secretsManager = secretsManager;
		this.metadataStore = metadataStore;
		this.envInitService = envInitService;
		this.logger = logger;

		// Register file system watcher events
		const subscriptions = [
			envFileWatcher.onDidCreate((event) => this.handleNewEnvFile(event.uri)),
			envFileWatcher.onDidChange((event) => this.handleEnvFileSave(event.uri)),
			envFileWatcher.onDidDelete((event) => this.handleDeletedEnvFile(event.uri)),
		];
		context.subscriptions.push(...subscriptions);

		// Pause/resume polling based on network connectivity
		const connectionMonitor = ConnectionMonitor.getInstance();
		context.subscriptions.push(
			connectionMonitor.onDidChangeConnectionState((online) => {
				if (online) {
					this.logger.info('[SyncManager] Connection restored - resuming sync');
					this.startPolling();
					this.pollRemoteChanges();
				} else {
					this.logger.info('[SyncManager] Connection lost - pausing sync');
					this.stopPolling();
				}
			})
		);
	}

	public static getInstance(
		context: vscode.ExtensionContext,
		apiClient: EnvvalApiClient,
		secretsManager: EnvvalVsCodeSecrets,
		metadataStore: EnvvalMetadataStore,
		envFileWatcher: EnvFileWatcher,
		envInitService: EnvInitService,
		logger: Logger
	): SyncManager {
		if (!SyncManager.instance) {
			SyncManager.instance = new SyncManager(
				context,
				apiClient,
				secretsManager,
				metadataStore,
				envFileWatcher,
				envInitService,
				logger
			);
		}
		return SyncManager.instance;
	}

	/**
	 * Performs an asynchronous poll of all tracked environments.
	 * Provides real-time feedback via the status bar.
	 */
	public async pollRemoteChanges(): Promise<void> {
		if (!ConnectionMonitor.getInstance().isOnline) {
			return;
		}

		const trackedEnvs = await this.metadataStore.getAllTrackedEnvs();
		if (trackedEnvs.length === 0) {
			return;
		}

		StatusBar.getInstance().setSyncState(true);
		try {
			for (const localMeta of trackedEnvs) {
				if (this.activeSyncs.has(localMeta.envId)) {
					continue;
				}

				this.activeSyncs.add(localMeta.envId);
				try {
					// Check if user recently chose to ignore this file
					if (localMeta.ignoredAt) {
						const ignoredTime = new Date(localMeta.ignoredAt).getTime();
						if (Date.now() - ignoredTime < IGNORE_INTERVAL_MS) {
							continue;
						}
					}

					let remoteEnv;
					try {
						remoteEnv = await this.apiClient.getEnv(localMeta.envId);
					} catch (error: unknown) {
						if (error instanceof ApiError && error.status === 404) {
							this.logger.warn(`Remote env ${localMeta.envId} missing. Triggering reconciliation.`);
							const workspacePath = await getWorkspacePath();
							if (workspacePath) {
								await this.envInitService.maybeInitializeOrRestore(
									Uri.file(path.join(workspacePath, localMeta.fileName))
								);
							}
							continue;
						}
						throw error;
					}

					if (!remoteEnv) {
						continue;
					}

					const key = await this.getEncryptionKey();
					if (!key) {
						continue;
					}

					const [ciphertext, iv] = remoteEnv.content.split(':');
					if (!ciphertext || !iv) {
						this.logger.error(`Invalid remote format for ${localMeta.fileName}`);
						continue;
					}

					const remoteContent = decryptEnv(ciphertext, iv, key);
					const remoteHash = hashEnv(remoteContent);

					if (remoteHash === localMeta.lastSyncedHash) {
						continue;
					}

					const workspacePath = await getWorkspacePath();
					if (!workspacePath) {
						continue;
					}

					const localFilePath = path.join(workspacePath, localMeta.fileName);
					const pathCheck = validateFilePath(localFilePath, workspacePath);
					if (!pathCheck.isValid) {
						this.logger.error(
							`Path validation failed for ${localMeta.fileName}: ${pathCheck.error}`
						);
						continue;
					}
					let localContent: string;
					try {
						localContent = fs.readFileSync(localFilePath, 'utf8');
					} catch {
						this.logger.info(`Ghost file detected: ${localMeta.fileName}`);
						await this.envInitService.maybeInitializeOrRestore(Uri.file(localFilePath));
						continue;
					}
					const localHash = hashEnv(localContent);

					// Standard three-way reconciliation logic
					if (localHash === localMeta.lastSyncedHash) {
						await this.applyRemoteUpdate(Uri.file(localFilePath), remoteContent, remoteHash);
					} else {
						await this.handleConflict(
							Uri.file(localFilePath),
							localMeta.envId,
							localMeta.fileName,
							localContent,
							localHash,
							remoteContent,
							remoteHash
						);
					}
				} catch (error: unknown) {
					this.logger.error(`Error polling ${localMeta.fileName}: ${formatError(error)}`);
				} finally {
					this.activeSyncs.delete(localMeta.envId);
				}
			}
		} catch (error: unknown) {
			this.logger.error(`Global sync poll failed: ${formatError(error)}`);
		} finally {
			StatusBar.getInstance().setSyncState(false, new Date());
		}
	}

	private async applyRemoteUpdate(uri: Uri, content: string, hash: string): Promise<void> {
		await this.updateFileInVscode(uri, content);
		const envCount = countEnvVars(content);
		const fileName = toWorkspaceRelativePath(uri);
		const result = await getRepoAndEnvIds(fileName, undefined, this.context);
		if (result) {
			await this.metadataStore.saveEnvMetadataSync(result.envId, fileName, hash, envCount);
			this.logger.debug(`Auto-pulled updates for ${fileName}`);
		}
	}

	private async handleConflict(
		uri: Uri,
		envId: string,
		fileName: string,
		localContent: string,
		localHash: string,
		remoteContent: string,
		remoteHash: string
	): Promise<void> {
		const choice = await window.showWarningMessage(
			`Envval Conflict: ${fileName} has local and remote changes.`,
			{ modal: true },
			'Use Local',
			'Use Remote'
		);

		try {
			if (choice === 'Use Local') {
				await this.pushEnv(envId);
			} else if (choice === 'Use Remote') {
				await this.applyRemoteUpdate(uri, remoteContent, remoteHash);
			}
		} catch (error: unknown) {
			this.logger.error(`Conflict resolution failed: ${formatError(error)}`);
		}
	}

	public startPolling(): void {
		this.stopPolling();
		const config = getVSCodeConfig();
		const interval = config.pollIntervalSeconds * 1000;
		this.pollInterval = setInterval(() => this.pollRemoteChanges(), interval);
	}

	public stopPolling(): void {
		if (this.pollInterval) {
			clearInterval(this.pollInterval);
			this.pollInterval = undefined;
		}
	}

	public async handleEnvFileSave(uri: Uri): Promise<void> {
		const fileName = toWorkspaceRelativePath(uri);
		const result = await getRepoAndEnvIds(fileName, undefined, this.context);
		if (!result) {
			return;
		}

		const { envId } = result;
		if (!ConnectionMonitor.getInstance().isOnline) {
			OperationQueueService.getInstance().enqueue('push', envId, fileName);
			this.logger.debug(`[SyncManager] Offline - queued push for ${fileName}`);
			return;
		}

		if (this.activeSyncs.has(envId)) {
			// Coalesce: store the latest URI so we can re-run once the active sync finishes.
			// Only the most recent save matters — intermediate states are irrelevant.
			this.pendingSyncs.set(envId, uri);
			return;
		}

		// All operations here are synchronous — no await, no event loop yield.
		// This is intentional: we must claim the lock (activeSyncs.add) before
		// any await so that a second debounce-fired save cannot pass the has()
		// check above with the same stale baseHash and race us to the API.
		let content: string;
		try {
			const stat = fs.statSync(uri.fsPath);
			if (stat.size > MAX_ENV_FILE_SIZE_BYTES) {
				window.showErrorMessage(
					`Envval: ${fileName} is too large to sync (${Math.round(stat.size / 1024)}KB, max ${MAX_ENV_FILE_SIZE_BYTES / 1000}KB)`
				);
				return;
			}
			content = fs.readFileSync(uri.fsPath, 'utf8');
		} catch {
			return; // File deleted between event and handler
		}

		const hash = hashEnv(content);

		// Claim the lock before the first await. Every call between has() and here
		// is synchronous, so the JS engine cannot interleave another invocation in
		// this window — making the check-then-act atomic.
		this.activeSyncs.add(envId);

		// Track whether we actually reached the network call so the finally block
		// only clears the status bar spinner when it was actually shown.
		let statusBarActive = false;

		try {
			const metadata = await this.metadataStore.loadEnvMetadata(envId);

			if (!metadata) {
				await this.envInitService.maybeInitializeOrRestore(uri);
				return;
			}

			if (metadata.lastSyncedHash === hash) {
				return; // No real change — skip, no status bar activity
			}

			statusBarActive = true;
			StatusBar.getInstance().setSyncState(true);

			const key = await this.getEncryptionKey();
			if (!key) {
				return;
			}

			const { ciphertext, iv } = encryptEnv(content, key);
			const envCount = countEnvVars(content);

			try {
				await this.apiClient.updateEnv(envId, {
					baseHash: metadata.lastSyncedHash,
					content: `${ciphertext}:${iv}`,
					latestHash: hash,
					envCount,
				});

				await this.metadataStore.saveEnvMetadataSync(envId, fileName, hash, envCount);
				this.logger.debug(`Synced ${fileName}`);
			} catch (error: unknown) {
				if (error instanceof ApiError && error.status === 404) {
					await this.metadataStore.clearMetadata(envId);
					await this.envInitService.maybeInitializeOrRestore(uri);
				} else if (error instanceof ApiError && error.status === 412) {
					this.logger.warn(`Conflict detected for ${fileName} - showing resolution dialog`);
					const choice = await window.showWarningMessage(
						`Conflict: ${fileName} was modified on another device`,
						'Use Local (overwrite remote)',
						'Use Remote (discard local)',
						'Cancel'
					);

					if (choice === 'Use Local (overwrite remote)') {
						await this.pushEnv(envId);
					} else if (choice === 'Use Remote (discard local)') {
						const pulled = await this.pullAndDecrypt(envId);
						if (pulled) {
							await this.applyRemoteUpdate(uri, pulled.content, pulled.hash);
						}
					}
				} else {
					throw error;
				}
			}
		} catch (error: unknown) {
			this.logger.error(`Auto-sync failed for ${fileName}: ${formatError(error)}`);
		} finally {
			this.activeSyncs.delete(envId);
			if (statusBarActive) {
				StatusBar.getInstance().setSyncState(false, new Date());
			}

			// If another save arrived while this sync was in flight, process it now.
			// setImmediate yields to the event loop before re-entering so pending I/O
			// (e.g. the metadata write that just completed) settles first.
			const pendingUri = this.pendingSyncs.get(envId);
			if (pendingUri) {
				this.pendingSyncs.delete(envId);
				setImmediate(() => this.handleEnvFileSave(pendingUri));
			}
		}
	}

	public async handleNewEnvFile(uri: Uri): Promise<void> {
		await this.envInitService.maybeInitializeOrRestore(uri);
	}

	public async handleDeletedEnvFile(uri: Uri): Promise<void> {
		const fileName = toWorkspaceRelativePath(uri);
		const result = await getRepoAndEnvIds(fileName, undefined, this.context);
		if (!result) {
			return;
		}
		const { envId } = result;
		if (!ConnectionMonitor.getInstance().isOnline) {
			this.logger.info(`[SyncManager] Offline - skipping remote delete for ${fileName}`);
			return;
		}
		if (await this.metadataStore.loadEnvMetadata(envId)) {
			await this.apiClient.deleteEnv(envId);
		}
	}

	public async updateFileInVscode(uri: Uri, content: string): Promise<void> {
		const edit = new WorkspaceEdit();
		const document = await vscode.workspace.openTextDocument(uri);
		const fullRange = new Range(
			document.positionAt(0),
			document.positionAt(document.getText().length)
		);
		edit.replace(uri, fullRange, content);
		await vscode.workspace.applyEdit(edit);
		await document.save();
	}

	public async pushEnv(envId: string): Promise<void> {
		if (this.activeSyncs.has(envId)) {
			return;
		}

		const metadata = await this.metadataStore.loadEnvMetadata(envId);
		if (!metadata) {
			return;
		}

		if (!ConnectionMonitor.getInstance().isOnline) {
			OperationQueueService.getInstance().enqueue('push', envId, metadata.fileName);
			window.showInformationMessage(`Envval: Queued push for ${metadata.fileName} (offline)`);
			return;
		}

		this.activeSyncs.add(envId);
		StatusBar.getInstance().setSyncState(true);

		try {
			const workspacePath = await getWorkspacePath();
			if (!workspacePath) {
				return;
			}

			const filePath = path.join(workspacePath, metadata.fileName);
			let content: string;
			try {
				const stat = fs.statSync(filePath);
				if (stat.size > MAX_ENV_FILE_SIZE_BYTES) {
					window.showErrorMessage(
						`Envval: ${metadata.fileName} is too large to sync (${Math.round(stat.size / 1024)}KB, max ${MAX_ENV_FILE_SIZE_BYTES / 1000}KB)`
					);
					return;
				}
				content = fs.readFileSync(filePath, 'utf8');
			} catch {
				return; // File deleted between event and handler
			}
			const hash = hashEnv(content);
			const key = await this.getEncryptionKey();
			if (!key) {
				return;
			}

			const { ciphertext, iv } = encryptEnv(content, key);
			const envCount = countEnvVars(content);

			await this.apiClient.updateEnv(envId, {
				baseHash: metadata.lastSyncedHash,
				content: `${ciphertext}:${iv}`,
				latestHash: hash,
				envCount,
			});

			await this.metadataStore.saveEnvMetadataSync(envId, metadata.fileName, hash, envCount);
			window.showInformationMessage(`Envval: Pushed ${metadata.fileName}`);
		} catch (error: unknown) {
			if (error instanceof ApiError && error.status === 412) {
				// Conflict detected
				this.logger.warn(`Push conflict for ${metadata.fileName}`);
				const choice = await window.showWarningMessage(
					`Conflict: ${metadata.fileName} was modified on another device`,
					'Force Push (overwrite remote)',
					'Pull Remote (discard local)',
					'Cancel'
				);

				if (choice === 'Force Push (overwrite remote)') {
					// Retry push - will use current hash
					await this.pushEnv(envId);
				} else if (choice === 'Pull Remote (discard local)') {
					const pulled = await this.pullAndDecrypt(envId);
					if (pulled) {
						const workspacePath = await getWorkspacePath();
						if (workspacePath) {
							await this.applyRemoteUpdate(
								Uri.file(path.join(workspacePath, metadata.fileName)),
								pulled.content,
								pulled.hash
							);
						}
					}
				}
			} else {
				this.logger.error(`Manual push failed: ${formatError(error)}`);
				window.showErrorMessage(`Envval Push Failed.`);
			}
		} finally {
			this.activeSyncs.delete(envId);
			StatusBar.getInstance().setSyncState(false, new Date());
		}
	}

	/**
	 * Processes all queued offline operations. Called when connection is restored.
	 */
	public async processQueuedOperations(): Promise<void> {
		const queue = OperationQueueService.getInstance();
		if (queue.isEmpty) {
			return;
		}

		this.logger.info(`[SyncManager] Processing ${queue.size} queued operations`);

		const result = await queue.processAll(async (op) => {
			if (op.type === 'push') {
				try {
					await this.pushEnv(op.envId);
					return true;
				} catch {
					return false;
				}
			}
			return false;
		});

		if (result.succeeded > 0) {
			window.showInformationMessage(
				`Envval: Back online - synced ${result.succeeded} queued change${result.succeeded > 1 ? 's' : ''}`
			);
		}
	}

	/** Fetches and decrypts remote env content. Returns null if unavailable or malformed. */
	private async pullAndDecrypt(envId: string): Promise<{ content: string; hash: string } | null> {
		const remoteEnv = await this.apiClient.getEnv(envId);
		if (!remoteEnv) {
			return null;
		}
		const parts = remoteEnv.content.split(':');
		if (parts.length < 2 || !parts[0] || !parts[1]) {
			this.logger.error(`Invalid remote content format for env ${envId}`);
			return null;
		}
		const key = await this.getEncryptionKey();
		if (!key) {
			return null;
		}
		const content = decryptEnv(parts[0], parts[1], key);
		return { content, hash: hashEnv(content) };
	}

	private async getEncryptionKey(): Promise<string | null> {
		if (this.cachedKey) {
			return this.cachedKey;
		}

		const keyMaterial = await this.secretsManager.getKeyMaterial();
		const userId = await this.secretsManager.getUserId();

		if (!keyMaterial || !userId) {
			return null;
		}

		this.cachedKey = await deriveKeyAsync(keyMaterial, userId);
		return this.cachedKey;
	}

	public invalidateCache(): void {
		this.cachedKey = null;
		this.logger.debug('Key cache invalidated.');
	}

	public dispose(): void {
		this.stopPolling();
		this.cachedKey = null;
		this.pendingSyncs.clear();
		SyncManager.instance = undefined!;
	}
}
