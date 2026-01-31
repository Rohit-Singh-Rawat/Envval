import { z } from 'zod';

/**
 * Shared validation schemas for repository-related endpoints.
 * Centralized here to ensure consistency and reduce duplication.
 */

/**
 * SHA-256 hash format used for repository identification.
 * 64 lowercase hexadecimal characters.
 */
export const repoIdHashSchema = z
	.string()
	.regex(/^[a-f0-9]{64}$/, 'Invalid repository ID format: expected SHA-256 hash');

/**
 * UUID format for legacy repository identification.
 */
export const repoIdUuidSchema = z.string().uuid('Invalid repository ID format: expected UUID');

/**
 * Pagination query parameters with sensible defaults.
 */
export const paginationSchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(10),
});

/**
 * Repository exists check query parameters.
 */
export const repoExistsQuerySchema = z.object({
	repoId: repoIdHashSchema,
});

/**
 * Repository param schema for routes with :repoId param.
 */
export const repoParamSchema = z.object({
	repoId: z.string().min(1, 'Repository ID is required'),
});

/**
 * Environment param schema for routes with :repoId and :envId.
 */
export const repoEnvParamSchema = z.object({
	repoId: z.string().min(1, 'Repository ID is required'),
	envId: z.string().min(1, 'Environment ID is required'),
});

/**
 * Repository creation body schema.
 */
export const repoCreateBodySchema = z.object({
	repoId: repoIdHashSchema,
	gitRemoteUrl: z.string().url('Invalid git remote URL format').optional(),
	workspacePath: z.string().min(1, 'Workspace path is required'),
});
