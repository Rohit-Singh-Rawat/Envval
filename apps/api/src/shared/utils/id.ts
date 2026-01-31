import { createHash } from 'crypto';

/**
 * Computes a deterministic environment ID from repoId and fileName.
 * This MUST match the client-side computation in the extension.
 * 
 * Formula: sha256(repoId + ":" + fileName) → hex string
 */
export function computeEnvId(repoId: string, fileName: string): string {
	return createHash('sha256').update(`${repoId}:${fileName}`).digest('hex');
}
