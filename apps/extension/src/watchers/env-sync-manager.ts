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
import { MAX_ENV_FILE_SIZE_BYTES } from '../lib/constants';
import { validateFilePath, toWorkspaceRelativePath } from '../utils/path-validator';
import { StatusBar } from '../ui/status-bar';
import { ConnectionMonitor } from '../services/connection-monitor';
import { OperationQueueService } from '../services/operation-queue';
import { formatError } from '../utils/format-error';

/**
 * Orchestrates synchronization between local .env files and the Envval server.
 * Manages file watchers, background polling, conflict resolution, and offline queuing.
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

	/** Cached derived AES key — avoids PBKDF2 on every operation. */
	private cachedKey: string | null = null;

	/** Prevents concurrent syncs for the same envId (Save vs Poll race). */
	private readonly activeSyncs: Set<string> = new Set();

	/**
	 * Coalesces rapid saves: only the latest pending URI per envId is kept.
	 * Intermediate states are irrelevant — we always upload the final version.
	 */
	private readonly pendingSyncs: Map<string, Uri> = new Map();

	/**
	 * Counts consecutive 404s per envId. Once MAX_CONSECUTIVE_404S is hit,
	 * auto-recovery stops and the user is prompted to re-initialize manually.
	 * This breaks the save → 404 → phantom-metadata → save infinite loop.
	 */
	private readonly consecutive404s: Map<string, number> = new Map();
	private static readonly MAX_CONSECUTIVE_404S = 3;

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

		const subscriptions = [
			envFileWatcher.onDidCreate((event) => this.handleNewEnvFile(event.uri)),
			envFileWatcher.onDidChange((event) => this.handleEnvFileSave(event.uri)),
			envFileWatcher.onDidDelete((event) => this.handleDeletedEnvFile(event.uri)),
		];
		context.subscriptions.push(...subscriptions);

		context.subscriptions.push(
			ConnectionMonitor.getInstance().onDidChangeConnectionState((online) => {
				if (online) {
					this.logger.info('[SyncManager] Connection restored — resuming sync');
					this.startPolling();
					this.pollRemoteChanges();
				} else {
					this.logger.info('[SyncManager] Connection lost — pausing sync');
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
				context, apiClient, secretsManager, metadataStore,
				envFileWatcher, envInitService, logger
			);
		}
		return SyncManager.instance;
	}

	// ── Shared file I/O helpers ───────────────────────────────────────────────

	/**
	 * Reads a file synchronously, enforcing the size ceiling.
	 * Returns null (and shows an error message) if the file is missing or oversized.
	 * Synchronous by design: callers need to claim the activeSyncs lock before
	 * any await, so the check-then-act must be atomic within the JS event loop turn.
	 */
	private readFileChecked(filePath: string, fileName: string): string | null {
		try {
			const stat = fs.statSync(filePath);
			if (stat.size > MAX_ENV_FILE_SIZE_BYTES) {
				window.showErrorMessage(
					`Envval: ${fileName} is too large to sync (${Math.round(stat.size / 1024)}KB, max ${MAX_ENV_FILE_SIZE_BYTES / 1000}KB)`
				);
				return null;
			}
			return fs.readFileSync(filePath, 'utf8');
		} catch {
			return null; // file deleted between event and handler
		}
	}

	/**
	 * Encrypts content and pushes it to the API.
	 * Throws on API errors so callers can handle 404/412 specifically.
	 */
	private async encryptAndUpload(
		envId: string,
		content: string,
		baseHash: string
	): Promise<{ hash: string; envCount: number }> {
		const key = await this.getEncryptionKey();
		if (!key) {
			throw new Error('Encryption key unavailable');
		}
		const hash = hashEnv(content);
		const { ciphertext, iv } = encryptEnv(content, key);
		const envCount = countEnvVars(content);

		await this.apiClient.updateEnv(envId, {
			baseHash,
			content: `${ciphertext}:${iv}`,
			latestHash: hash,
			envCount,
		});

		return { hash, envCount };
	}

	// ── Polling ───────────────────────────────────────────────────────────────

	public async pollRemoteChanges(): Promise<void> {
		if (!ConnectionMonitor.getInstance().isOnline) {
			return;
		}

		const trackedEnvs = await this.metadataStore.getAllTrackedEnvs();
		if (trackedEnvs.length === 0) {
			return;
		}

		let syncedAny = false;
		try {
			for (const localMeta of trackedEnvs) {
				if (this.activeSyncs.has(localMeta.envId)) {
					continue;
				}

				this.activeSyncs.add(localMeta.envId);
				try {
					let remoteEnv;
					try {
						remoteEnv = await this.apiClient.getEnv(localMeta.envId);
					} catch (error: unknown) {
						if (error instanceof ApiError && error.status === 404) {
							this.logger.warn(`Remote env ${localMeta.envId} missing — triggering reconciliation`);
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

					if (!remoteEnv?.content) {
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

					const freshMeta = await this.metadataStore.loadEnvMetadata(localMeta.envId);
					if (!freshMeta) {
						this.logger.debug(`[SyncManager] Metadata cleared for ${localMeta.fileName} during poll — skipping`);
						continue;
					}
					const syncedHash = freshMeta.lastSyncedHash;

					if (remoteHash === syncedHash) {
						continue; // no remote change — don't touch the status bar
					}

					const workspacePath = await getWorkspacePath();
					if (!workspacePath) {
						continue;
					}

					const localFilePath = path.join(workspacePath, localMeta.fileName);
					const pathCheck = validateFilePath(localFilePath, workspacePath);
					if (!pathCheck.isValid) {
						this.logger.error(`Path validation failed for ${localMeta.fileName}: ${pathCheck.error}`);
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

					// A real remote update is about to be applied — show Syncing now.
					if (!syncedAny) {
						StatusBar.getInstance().setSyncState(true);
						syncedAny = true;
					}

					if (localHash === syncedHash) {
						await this.applyRemoteUpdate(Uri.file(localFilePath), remoteContent, remoteHash, localMeta.envId);
					} else {
						await this.handleConflict(
							Uri.file(localFilePath),
							localMeta.envId,
							localMeta.fileName,
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
			if (syncedAny) {
				StatusBar.getInstance().setSyncState(false, new Date());
			}
		}
	}

	private async applyRemoteUpdate(uri: Uri, content: string, hash: string, knownEnvId?: string): Promise<void> {
		await this.updateFileInVscode(uri, content);
		const envCount = countEnvVars(content);
		const fileName = toWorkspaceRelativePath(uri);
		// Prefer the caller-supplied server envId over a recomputed one.
		// getRepoAndEnvIds returns a *computed* ID that may differ from the server's ID,
		// which would save the hash under the wrong key and cause false conflicts on the next poll.
		let targetEnvId = knownEnvId;
		if (!targetEnvId) {
			const existing = await this.metadataStore.loadEnvMetadataByFileName(fileName);
			targetEnvId = existing?.envId ?? (await getRepoAndEnvIds(fileName, this.context))?.envId;
		}
		if (targetEnvId) {
			await this.metadataStore.saveEnvMetadataSync(targetEnvId, fileName, hash, envCount);
			this.logger.debug(`Auto-pulled updates for ${fileName}`);
		}
	}

	private async handleConflict(
		uri: Uri,
		envId: string,
		fileName: string,
		remoteContent: string,
		remoteHash: string
	): Promise<void> {
		const choice = await window.showWarningMessage(
			`Envval Conflict: ${fileName} has local and remote changes.`,
			'Use Local',
			'Use Remote'
		);

		try {
			if (choice === 'Use Local') {
				await this.pushEnv(envId);
			} else if (choice === 'Use Remote') {
				await this.applyRemoteUpdate(uri, remoteContent, remoteHash, envId);
			}
		} catch (error: unknown) {
			this.logger.error(`Conflict resolution failed: ${formatError(error)}`);
		}
	}

	// ── Polling lifecycle ─────────────────────────────────────────────────────

	public startPolling(): void {
		this.stopPolling();
		const interval = getVSCodeConfig().pollIntervalSeconds * 1000;
		this.pollInterval = setInterval(() => this.pollRemoteChanges(), interval);
	}

	public stopPolling(): void {
		if (this.pollInterval) {
			clearInterval(this.pollInterval);
			this.pollInterval = undefined;
		}
	}

	// ── File event handlers ───────────────────────────────────────────────────

	public async handleEnvFileSave(uri: Uri): Promise<void> {
		const fileName = toWorkspaceRelativePath(uri);
		const result = await getRepoAndEnvIds(fileName, this.context);
		if (!result) {
			return;
		}

		const computedEnvId = result.envId;
		const existingMetadata =
			(await this.metadataStore.loadEnvMetadata(computedEnvId)) ??
			(await this.metadataStore.loadEnvMetadataByFileName(fileName));
		const envId = existingMetadata?.envId ?? computedEnvId;

		if (!ConnectionMonitor.getInstance().isOnline) {
			OperationQueueService.getInstance().enqueue('push', envId, fileName);
			return;
		}

		if (this.activeSyncs.has(envId)) {
			// Coalesce: keep only the latest URI — intermediate states are irrelevant.
			this.pendingSyncs.set(envId, uri);
			return;
		}

		// Read synchronously before claiming the lock so size/existence is checked
		// atomically with the lock acquisition (no await between check and add).
		const content = this.readFileChecked(uri.fsPath, fileName);
		if (content === null) {
			return;
		}

		const hash = hashEnv(content);

		// Claim the lock synchronously — everything above is sync, so no other
		// invocation can interleave between the has() check and this add().
		this.activeSyncs.add(envId);
		let statusBarActive = false;

		try {
			const metadata = existingMetadata ?? (await this.metadataStore.loadEnvMetadata(envId));

			if (!metadata) {
				await this.envInitService.maybeInitializeOrRestore(uri);
				return;
			}

			if (metadata.lastSyncedHash === hash) {
				return; // no real change
			}

			statusBarActive = true;
			StatusBar.getInstance().setSyncState(true);

			try {
				const { hash: newHash, envCount } = await this.encryptAndUpload(
					envId, content, metadata.lastSyncedHash
				);
				await this.metadataStore.saveEnvMetadataSync(envId, fileName, newHash, envCount);
				this.consecutive404s.delete(envId);
				this.logger.debug(`Synced ${fileName}`);
			} catch (error: unknown) {
				if (error instanceof ApiError && error.status === 404) {
					await this.handle404OnSave(envId, fileName, uri);
				} else if (error instanceof ApiError && error.status === 412) {
					await this.handle412OnSave(envId, fileName, uri);
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

			// Process the next coalesced save, if any, after current I/O settles.
			const pendingUri = this.pendingSyncs.get(envId);
			if (pendingUri) {
				this.pendingSyncs.delete(envId);
				setImmediate(() => this.handleEnvFileSave(pendingUri));
			}
		}
	}

	private async handle404OnSave(envId: string, fileName: string, uri: Uri): Promise<void> {
		const failures = (this.consecutive404s.get(envId) ?? 0) + 1;

		if (failures >= SyncManager.MAX_CONSECUTIVE_404S) {
			this.logger.error(`${failures} consecutive 404s for ${fileName} — halting auto-recovery`);
			window.showErrorMessage(
				`Envval: "${fileName}" was not found on the server after ${failures} attempts. Open the Envval panel and re-initialize to fix.`
			);
			await this.metadataStore.clearMetadata(envId);
			this.consecutive404s.delete(envId);
			return;
		}

		this.consecutive404s.set(envId, failures);
		this.logger.debug(`404 attempt ${failures}/${SyncManager.MAX_CONSECUTIVE_404S} for ${fileName}`);
		await this.metadataStore.clearMetadata(envId);
		await this.envInitService.maybeInitializeOrRestore(uri);
	}

	private async handle412OnSave(envId: string, fileName: string, uri: Uri): Promise<void> {
		this.logger.warn(`Conflict on save for ${fileName}`);
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
				await this.applyRemoteUpdate(uri, pulled.content, pulled.hash, envId);
			}
		}
	}

	public async handleNewEnvFile(uri: Uri): Promise<void> {
		await this.envInitService.maybeInitializeOrRestore(uri);
	}

	public async handleDeletedEnvFile(uri: Uri): Promise<void> {
		const fileName = toWorkspaceRelativePath(uri);
		const result = await getRepoAndEnvIds(fileName, this.context);
		if (!result) {
			return;
		}
		const { envId } = result;

		if (!ConnectionMonitor.getInstance().isOnline) {
			this.logger.info(`Offline — skipping remote delete for ${fileName}`);
			return;
		}

		if (await this.metadataStore.loadEnvMetadata(envId)) {
			await this.apiClient.deleteEnv(envId);
		}
	}

	// ── Manual push ───────────────────────────────────────────────────────────

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
			const content = this.readFileChecked(filePath, metadata.fileName);
			if (content === null) {
				return;
			}

			const { hash, envCount } = await this.encryptAndUpload(
				envId, content, metadata.lastSyncedHash
			);
			await this.metadataStore.saveEnvMetadataSync(envId, metadata.fileName, hash, envCount);
			window.showInformationMessage(`Envval: Pushed ${metadata.fileName}`);
		} catch (error: unknown) {
			if (error instanceof ApiError && error.status === 412) {
				await this.handle412OnPush(envId, metadata.fileName);
			} else {
				this.logger.error(`Manual push failed: ${formatError(error)}`);
				window.showErrorMessage('Envval Push Failed.');
			}
		} finally {
			this.activeSyncs.delete(envId);
			StatusBar.getInstance().setSyncState(false, new Date());
		}
	}

	private async handle412OnPush(envId: string, fileName: string): Promise<void> {
		this.logger.warn(`Push conflict for ${fileName}`);
		const choice = await window.showWarningMessage(
			`Conflict: ${fileName} was modified on another device`,
			'Force Push (overwrite remote)',
			'Pull Remote (discard local)',
			'Cancel'
		);

		if (choice === 'Force Push (overwrite remote)') {
			await this.pushEnv(envId);
		} else if (choice === 'Pull Remote (discard local)') {
			const pulled = await this.pullAndDecrypt(envId);
			if (pulled) {
				const workspacePath = await getWorkspacePath();
				const metadata = await this.metadataStore.loadEnvMetadata(envId);
				if (workspacePath && metadata) {
					await this.applyRemoteUpdate(
						Uri.file(path.join(workspacePath, metadata.fileName)),
						pulled.content,
						pulled.hash,
						envId
					);
				}
			}
		}
	}

	// ── Offline queue ─────────────────────────────────────────────────────────

	public async processQueuedOperations(): Promise<void> {
		const queue = OperationQueueService.getInstance();
		if (queue.isEmpty) {
			return;
		}

		this.logger.info(`Processing ${queue.size} queued operations`);

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
				`Envval: Back online — synced ${result.succeeded} queued change${result.succeeded > 1 ? 's' : ''}`
			);
		}
	}

	// ── Internal crypto helpers ───────────────────────────────────────────────

	/** Fetches and decrypts the remote env. Returns null if unavailable or malformed. */
	private async pullAndDecrypt(envId: string): Promise<{ content: string; hash: string } | null> {
		const remoteEnv = await this.apiClient.getEnv(envId);
		if (!remoteEnv?.content) {
			return null;
		}
		const [ciphertext, iv] = remoteEnv.content.split(':');
		if (!ciphertext || !iv) {
			this.logger.error(`Invalid remote content format for env ${envId}`);
			return null;
		}
		const key = await this.getEncryptionKey();
		if (!key) {
			return null;
		}
		const content = decryptEnv(ciphertext, iv, key);
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
	}

	// ── VS Code file update ───────────────────────────────────────────────────

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

	// ── Lifecycle ─────────────────────────────────────────────────────────────

	public dispose(): void {
		this.stopPolling();
		this.cachedKey = null;
		this.pendingSyncs.clear();
		this.consecutive404s.clear();
		SyncManager.instance = undefined!;
	}
}
