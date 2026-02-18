/**
 * Workspace validation configuration constants.
 * Only this file needs to change when new unsafe locations are discovered.
 */

export const WORKSPACE_VALIDATION_CACHE_TTL_MS = 300_000; // 5 minutes

// The path-safety checker walks the full ancestor chain, so these names are
// caught even when nested under cloud-sync folders (e.g. OneDrive\Desktop).

export const USER_HOME_SUBDIRS = [
	// Standard shell folders (Windows / cross-platform)
	'Desktop',
	'Documents',
	'Downloads',
	'Pictures',
	'Videos',
	'Music',
	'Favorites',
	'Contacts',
	'Searches',
	'Saved Games',
	'Links',
	// macOS-specific
	'Movies',
	'Public',
	'Sites',
	// Cloud-sync roots (the root itself is broad; project folders inside are fine)
	'OneDrive',
	'Google Drive',
	'Dropbox',
	'Box',
	'iCloud Drive',
	'iCloudDrive',
	'Mega',
	'pCloud',
] as const;

export type UserHomeSubdir = (typeof USER_HOME_SUBDIRS)[number];

// Split by platform for correct case-sensitivity in path-safety.ts
export const WINDOWS_SYSTEM_DIRECTORIES = [
	'C:\\Windows',
	'C:\\Windows\\System32',
	'C:\\Windows\\SysWOW64',
	'C:\\Program Files',
	'C:\\Program Files (x86)',
	'C:\\ProgramData',
	'C:\\Recovery',
	'C:\\$Recycle.Bin',
	'C:\\System Volume Information',
] as const;

export const UNIX_SYSTEM_DIRECTORIES = [
	'/System',
	'/Library',
	'/usr',
	'/bin',
	'/sbin',
	'/etc',
	'/var',
	'/tmp',
	'/dev',
	'/proc',
	'/sys',
	'/boot',
	'/root',
	'/Applications',
	'/Volumes',
] as const;

// Covers decoded, URL-encoded (both cases), and null-byte injection
export const PATH_TRAVERSAL_PATTERNS = [
	'../',
	'..\\',
	'%2e%2e%2f',
	'%2e%2e%5c',
	'%2E%2E%2F',
	'%2E%2E%5C',
	'%2E%2e%2F',
	'%2e%2E%5C',
	'\0',
	'%00',
] as const;
