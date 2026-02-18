import { createHash } from 'crypto';

/**
 * Computes a deterministic environment ID from repoId and fileName.
 * This MUST match the client-side computation in the extension.
 *
 * @param repoId - SHA-256 hex digest identifying the repository.
 * @param fileName - Workspace-relative path (e.g. "apps/api/.env"), not just the basename.
 *                   Using relative paths ensures monorepo files with the same name produce unique IDs.
 *
 * Formula: sha256(repoId + ":" + fileName) → hex string
 */
export function computeEnvId(repoId: string, fileName: string): string {
	return createHash('sha256').update(`${repoId}:${fileName}`).digest('hex');
}
