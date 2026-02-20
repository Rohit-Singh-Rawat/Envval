import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { EnvMetadata } from './metadata-store';
import { hashEnv } from '../utils/crypto';
import { EnvSyncStatus } from '../views/tracked-envs';
import { Logger } from '../utils/logger';

interface StatusCacheEntry {
	status: EnvSyncStatus;
	mtime: number;
	hash: string;
}

export class EnvStatusCalculator {
	private static instance: EnvStatusCalculator;
	private readonly cache = new Map<string, StatusCacheEntry>();

	private constructor(private readonly logger: Logger) {}

	public static getInstance(logger: Logger): EnvStatusCalculator {
		if (!EnvStatusCalculator.instance) {
			EnvStatusCalculator.instance = new EnvStatusCalculator(logger);
		}
		return EnvStatusCalculator.instance;
	}

	/**
	 * Returns the sync status of a tracked env file.
	 * Uses mtime-based caching to avoid redundant hashing on every tree refresh.
	 * Returns 'missing' when the file cannot be read — distinct from 'synced'.
	 */
	public calculateStatus(metadata: EnvMetadata): EnvSyncStatus {
		const fileUri = this.resolveUri(metadata.fileName);
		const cacheKey = fileUri.fsPath;

		try {
			const stats = fs.statSync(fileUri.fsPath);
			const mtime = stats.mtimeMs;

			const cached = this.cache.get(cacheKey);
			if (cached && cached.mtime === mtime && cached.hash === metadata.lastSyncedHash) {
				return cached.status;
			}

			const content = fs.readFileSync(fileUri.fsPath, 'utf8');
			const status: EnvSyncStatus =
				hashEnv(content) === metadata.lastSyncedHash ? 'synced' : 'modified';

			this.cache.set(cacheKey, { status, mtime, hash: metadata.lastSyncedHash });
			return status;
		} catch {
			// File is unreadable or deleted — remove stale cache and signal clearly.
			this.cache.delete(cacheKey);
			this.logger.debug(`EnvStatusCalculator: cannot read ${metadata.fileName}, marking as missing`);
			return 'missing';
		}
	}

	public invalidateCache(fileName?: string): void {
		if (fileName) {
			this.cache.delete(this.resolveUri(fileName).fsPath);
		} else {
			this.cache.clear();
		}
	}

	private resolveUri(fileName: string): vscode.Uri {
		const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
		return vscode.Uri.file(root ? path.join(root, fileName) : fileName);
	}
}
