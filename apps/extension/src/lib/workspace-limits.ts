/**
 * Workspace validation configuration constants.
 *
 * Note: File scanning performance is handled by VS Code's native findFiles API.
 * These constants are for workspace path safety validation and caching only.
 */

// Workspace validation caching
export const WORKSPACE_VALIDATION_CACHE_TTL_MS = 300_000; // 5 minutes

// Path safety constants - used to detect unsafe workspace locations
export const WINDOWS_UNSAFE_PATHS = [
	'C:\\',
	'D:\\',
	'E:\\',
	'F:\\',
] as const;

export const USER_HOME_SUBDIRS = [
	'Desktop',
	'Documents',
	'Downloads',
	'Pictures',
	'Videos',
	'Music',
	'OneDrive',
] as const;

export const SYSTEM_DIRECTORIES = [
	'/System',
	'/Library',
	'/usr',
	'/bin',
	'/sbin', // macOS/Linux
	'C:\\Windows',
	'C:\\Program Files',
	'C:\\Program Files (x86)', // Windows
] as const;

export const PATH_TRAVERSAL_PATTERNS = ['../', '..\\', '%2e%2e%2f', '%2e%2e%5c'] as const;
