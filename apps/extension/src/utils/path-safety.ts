import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import {
	WINDOWS_UNSAFE_PATHS,
	USER_HOME_SUBDIRS,
	SYSTEM_DIRECTORIES,
	PATH_TRAVERSAL_PATTERNS
} from '../lib/workspace-limits';

export interface PathSafetyResult {
	isSafe: boolean;
	reason?: 'root_drive' | 'user_home_top' | 'user_home_subdir' | 'system_directory' | 'safe';
	suggestedAction?: string;
	estimatedFiles?: number;
}

export interface PathValidationOptions {
	allowUserHomeSubdirs?: boolean;
	maxDepthToCheck?: number;
}

/**
 * Validates workspace path safety to prevent performance issues from scanning broad directories.
 * Detects unsafe paths like Desktop, Documents, C:\, etc. that contain many unrelated files.
 */
export function isPathSafe(
	fsPath: string,
	options: PathValidationOptions = {}
): PathSafetyResult {
	const { allowUserHomeSubdirs = false } = options;

	try {
		const normalized = normalizeAndValidatePath(fsPath);

		// Check 1: Root drives (C:\, D:\, /, etc.)
		if (isRootDrive(normalized)) {
			return {
				isSafe: false,
				reason: 'root_drive',
				suggestedAction: 'Select a specific project folder instead of the entire drive',
				estimatedFiles: 100000
			};
		}

		// Check 2: User home root
		if (isUserHomeRoot(normalized)) {
			return {
				isSafe: false,
				reason: 'user_home_top',
				suggestedAction: 'Select a specific project folder instead of your home directory',
				estimatedFiles: 50000
			};
		}

		// Check 3: User home subdirs (Desktop, Documents, etc.)
		if (isUserHomeSubdir(normalized)) {
			if (!allowUserHomeSubdirs) {
				return {
					isSafe: false,
					reason: 'user_home_subdir',
					suggestedAction: 'This directory may contain many files. Consider selecting a specific project folder.',
					estimatedFiles: 10000
				};
			}
		}

		// Check 4: System directories
		if (isSystemDirectory(normalized)) {
			return {
				isSafe: false,
				reason: 'system_directory',
				suggestedAction: 'System directories cannot be scanned for security reasons'
			};
		}

		return { isSafe: true, reason: 'safe' };
	} catch (error) {
		// If we can't normalize/validate the path, consider it unsafe
		return {
			isSafe: false,
			reason: 'system_directory',
			suggestedAction: 'Invalid or inaccessible path'
		};
	}
}

/**
 * Normalizes path and validates it doesn't contain traversal sequences.
 * Throws error if path contains suspicious patterns.
 */
export function normalizeAndValidatePath(fsPath: string): string {
	
	// Check for path traversal patterns
	for (const pattern of PATH_TRAVERSAL_PATTERNS) {
		if (fsPath.includes(pattern)) {
			throw new Error(`Path contains traversal sequence: ${pattern}`);
		}
	}
// Normalize using path.normalize and path.resolve for consistent format
	const normalized = path.normalize(path.resolve(fsPath));

	return normalized;
}

/**
 * Detects if a path is likely part of a symlink loop by checking visited paths.
 * Must be used with a Set that persists across recursive calls.
 */
export function isSymlinkLoop(
	targetPath: string,
	visitedPaths: Set<string>
): boolean {
	try {
		const realPath = fs.realpathSync(targetPath);
		return visitedPaths.has(realPath);
	} catch {
		// If we can't resolve the symlink, treat it as potentially unsafe
		return true;
	}
}

/**
 * Gets user's home directory in a cross-platform way.
 */
export function getUserHomeDirectory(): string {
	return os.homedir();
}

/**
 * Checks if a path is a descendant of any unsafe paths.
 * Used as a secondary check for paths that might bypass direct detection.
 */
export function isDescendantOfUnsafePath(fsPath: string): boolean {
	const normalized = path.normalize(path.resolve(fsPath));
	const homeDir = getUserHomeDirectory();

	// Check against root drives
	if (isRootDrive(normalized)) {
		return true;
	}

	// Check if it's directly under home directory
	const relativePath = path.relative(homeDir, normalized);
	if (relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath)) {
		const parts = relativePath.split(path.sep);
		if (parts.length === 1) {
			// Direct subdirectory of home (Desktop, Documents, etc.)
			return USER_HOME_SUBDIRS.includes(parts[0] as typeof USER_HOME_SUBDIRS[number]);
		}
	}

	return false;
}

/**
 * Detects if path is a root drive (C:\, D:\, /, etc.)
 */
function isRootDrive(fsPath: string): boolean {
	const normalized = path.normalize(fsPath);

	// Windows: C:\, D:\, etc.
	if (process.platform === 'win32') {
		for (const unsafePath of WINDOWS_UNSAFE_PATHS) {
			if (normalized === path.normalize(unsafePath)) {
				return true;
			}
		}
		// Also check generic pattern: single letter followed by :\ or :/
		if (/^[A-Za-z]:[\\\/]?$/.test(normalized)) {
			return true;
		}
	}

	// Unix: Root directory
	if (normalized === '/' || normalized === path.sep) {
		return true;
	}

	return false;
}

/**
 * Checks if path is the user's home directory root.
 */
function isUserHomeRoot(fsPath: string): boolean {
	const normalized = path.normalize(fsPath);
	const homeDir = path.normalize(getUserHomeDirectory());
	return normalized === homeDir;
}

/**
 * Checks if path is a common user subdirectory (Desktop, Documents, Downloads, etc.)
 */
function isUserHomeSubdir(fsPath: string): boolean {
	const normalized = path.normalize(fsPath);
	const homeDir = getUserHomeDirectory();

	for (const subdir of USER_HOME_SUBDIRS) {
		const unsafePath = path.normalize(path.join(homeDir, subdir));
		if (normalized === unsafePath) {
			return true;
		}
	}

	return false;
}

/**
 * Checks if path is a system directory that should never be scanned.
 */
function isSystemDirectory(fsPath: string): boolean {
	const normalized = path.normalize(fsPath).toLowerCase();

	for (const sysDir of SYSTEM_DIRECTORIES) {
		const normalizedSysDir = path.normalize(sysDir).toLowerCase();
		if (normalized === normalizedSysDir || normalized.startsWith(normalizedSysDir + path.sep)) {
			return true;
		}
	}

	return false;
}
