const ENV_FILE_NAME_PATTERN = /^(?:[a-zA-Z0-9_\-.][\w.\-]*\/)*\.?env(\.[a-zA-Z0-9_-]+)*$/;

export function normalizeEnvFilePath(filePath: string): string {
	return filePath.replace(/\\/g, '/');
}

/**
 * Mirrors API-side filename constraints so extension discovery and backend
 * validation stay aligned.
 */
export function isValidEnvFilePath(filePath: string): boolean {
	const normalized = normalizeEnvFilePath(filePath);
	if (normalized.includes('..') || /\s/.test(normalized)) {
		return false;
	}
	return ENV_FILE_NAME_PATTERN.test(normalized);
}
