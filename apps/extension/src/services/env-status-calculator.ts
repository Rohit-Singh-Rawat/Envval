import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { EnvMetadata } from './metadata-store';
import { hashEnv } from '../utils/crypto';
import { EnvSyncStatus } from '../views/tracked-envs';
import { Logger } from '../utils/logger';
import { formatError } from '../utils/format-error';

interface StatusCacheEntry {
	status: EnvSyncStatus;
	mtime: number;
	hash: string;
}

/**
 * Service responsible for calculating environment file sync status.
 * Implements caching to avoid redundant file I/O and hash calculations.
 * 
 * This is separated from the UI layer to follow single responsibility principle
 * and enable easier testing and reuse across different components.
 */
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
	 * Calculate the sync status of an environment file.
	 * Uses caching based on file modification time to avoid redundant hashing.
	 */
	public calculateStatus(metadata: EnvMetadata): EnvSyncStatus {
		if (metadata.ignoredAt) {
			return 'ignored';
		}
		
		const fileUri = this.getFileUri(metadata.fileName);

		try {
			const stats = fs.statSync(fileUri.fsPath);
			const mtime = stats.mtimeMs;
			const cacheKey = fileUri.fsPath;
			
			// Check cache validity using modification time
			const cached = this.cache.get(cacheKey);
			if (cached && cached.mtime === mtime && cached.hash === metadata.lastSyncedHash) {
				return cached.status;
			}
			
			// Cache miss or invalidated - recalculate
			const content = fs.readFileSync(fileUri.fsPath, 'utf8');
			const localHash = hashEnv(content);
			const status: EnvSyncStatus = localHash === metadata.lastSyncedHash ? 'synced' : 'modified';
			
			// Update cache
			this.cache.set(cacheKey, {
				status,
				mtime,
				hash: metadata.lastSyncedHash
			});
			
			return status;
		} catch (error) {
			const errorMsg = formatError(error);
			this.logger.error(`Failed to calculate status for ${metadata.fileName}: ${errorMsg}`);
			// Graceful degradation: assume synced if we can't determine status
			return 'synced';
		}
	}
	
	/**
	 * Invalidate cache for a specific file or all files.
	 * Should be called when files are modified externally or metadata changes.
	 */
	public invalidateCache(fileName?: string): void {
		if (fileName) {
			const fileUri = this.getFileUri(fileName);
			this.cache.delete(fileUri.fsPath);
			this.logger.debug(`Cache invalidated for: ${fileName}`);
		} else {
			this.cache.clear();
			this.logger.debug('Entire status cache cleared');
		}
	}
	
	private getFileUri(fileName: string): vscode.Uri {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		if (workspaceFolders && workspaceFolders.length > 0) {
			const rootPath = workspaceFolders[0].uri.fsPath;
			return vscode.Uri.file(path.join(rootPath, fileName));
		}
		return vscode.Uri.file(fileName);
	}
}
