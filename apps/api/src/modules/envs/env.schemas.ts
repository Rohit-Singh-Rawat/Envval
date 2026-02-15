import { z } from 'zod';
import {
	MAX_ENV_CONTENT_LENGTH,
	MAX_ENV_FILE_NAME_LENGTH,
	MAX_ENV_VAR_COUNT,
} from '@/shared/constants/system-limits';

/**
 * Matches valid env file names: .env, .env.local, .env.production, .env.staging.local, etc.
 * Allows an optional leading dot, the literal "env", then zero or more dot-separated segments
 * composed of alphanumerics, hyphens, and underscores.
 */
const ENV_FILE_NAME_PATTERN = /^\.?env(\.[a-zA-Z0-9_-]+)*$/;

export const envIdParamSchema = z.object({
	envId: z.string().min(1, 'Environment ID is required'),
});

export const envExistsQuerySchema = z.object({
	repoId: z.string().min(1, 'Repository ID is required'),
	fileName: z.string().min(1, 'File name is required'),
});

export const envPaginationSchema = z.object({
	repoId: z.string().optional(),
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(50),
	includeContent: z.preprocess((v) => v === 'true' || v === true, z.boolean()).optional(),
});

export const createEnvSchema = z.object({
	repoId: z.string().min(1, 'Repository ID is required'),
	fileName: z
		.string()
		.min(1, 'File name is required')
		.max(MAX_ENV_FILE_NAME_LENGTH, `File name must be ${MAX_ENV_FILE_NAME_LENGTH} characters or less`)
		.regex(ENV_FILE_NAME_PATTERN, 'File name must be a valid env file (e.g. .env, .env.local)'),
	content: z
		.string()
		.max(MAX_ENV_CONTENT_LENGTH, `Content exceeds ${MAX_ENV_CONTENT_LENGTH / 1000}KB limit`),
	latestHash: z.string().min(1, 'Hash is required'),
	envCount: z.number().int().nonnegative().max(MAX_ENV_VAR_COUNT, `Variable count exceeds ${MAX_ENV_VAR_COUNT}`).default(0),
});

export const updateEnvSchema = z.object({
	baseHash: z.string().min(1, 'Base hash is required for conflict detection'),
	fileName: z
		.string()
		.min(1)
		.max(MAX_ENV_FILE_NAME_LENGTH)
		.regex(ENV_FILE_NAME_PATTERN, 'File name must be a valid env file')
		.optional(),
	content: z
		.string()
		.max(MAX_ENV_CONTENT_LENGTH, `Content exceeds ${MAX_ENV_CONTENT_LENGTH / 1000}KB limit`)
		.optional(),
	latestHash: z.string().min(1).optional(),
	envCount: z.number().int().nonnegative().max(MAX_ENV_VAR_COUNT).optional(),
});

export type CreateEnvBody = z.infer<typeof createEnvSchema>;
export type UpdateEnvBody = z.infer<typeof updateEnvSchema>;
