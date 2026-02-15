import { z } from 'zod';
import { MAX_WORKSPACE_PATH_LENGTH } from '@/shared/constants/system-limits';

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
 * Slug format: lowercase alphanumeric with hyphens, 1-100 characters.
 */
export const repoSlugSchema = z
	.string()
	.min(1, 'Slug is required')
	.max(100, 'Slug must be 100 characters or less')
	.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens');

/**
 * Repository name: 1-100 characters.
 */
export const repoNameSchema = z
	.string()
	.min(1, 'Name is required')
	.max(100, 'Name must be 100 characters or less');

/**
 * Pagination query parameters with sensible defaults.
 */
export const paginationSchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(10),
	search: z.string().optional(),
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

export const envQuerySchema = z.object({
	includeContent: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
});

/**
 * Repository param schema for routes with :slug param.
 */
export const repoSlugParamSchema = z.object({
	slug: repoSlugSchema,
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
	name: repoNameSchema,
	gitRemoteUrl: z.string().min(1, 'Git remote URL cannot be empty').optional(),
	workspacePath: z.string().min(1, 'Workspace path is required').max(MAX_WORKSPACE_PATH_LENGTH),
});

/**
 * Repository update body schema.
 */
export const repoUpdateBodySchema = z.object({
	name: repoNameSchema.optional(),
	slug: repoSlugSchema.optional(),
});
