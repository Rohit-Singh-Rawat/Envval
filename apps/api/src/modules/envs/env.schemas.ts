import { z } from 'zod';

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
});

export const createEnvSchema = z.object({
	repoId: z.string().min(1, 'Repository ID is required'),
	fileName: z.string().min(1, 'File name is required'),
	content: z.string(),
	latestHash: z.string().min(1, 'Hash is required'),
	envCount: z.number().int().nonnegative().default(0),
});

export const updateEnvSchema = z.object({
	fileName: z.string().min(1).optional(),
	content: z.string().optional(),
	latestHash: z.string().min(1).optional(),
	envCount: z.number().int().nonnegative().optional(),
});

export type CreateEnvBody = z.infer<typeof createEnvSchema>;
export type UpdateEnvBody = z.infer<typeof updateEnvSchema>;
