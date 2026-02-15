import { honoFactory } from '@/shared/utils/factory';
import { customZValidator } from '@/shared/utils/zod-validator';
import { authMiddleware } from '@/shared/middleware/auth.middleware';
import {
	HTTP_UNAUTHORIZED,
	HTTP_CREATED,
	HTTP_CONFLICT,
	HTTP_FORBIDDEN,
	HTTP_INTERNAL_SERVER_ERROR,
} from '@/shared/constants/http-status';
import { MAX_ENVS_PER_REPO } from '@/shared/constants/system-limits';
import { EnvService } from './env.service';
import { createEnvSchema } from './env.schemas';
import { logger } from '@/shared/utils/logger';

const envService = new EnvService();

export const postEnvsHandler = honoFactory.createHandlers(
	customZValidator('json', createEnvSchema),
	authMiddleware,
	async (ctx) => {
		const user = ctx.get('user');
		if (!user) {
			return ctx.json({ error: 'Unauthorized' }, HTTP_UNAUTHORIZED);
		}
		try {
			const body = ctx.req.valid('json');

			const existingEnv = await envService.getEnvironmentByFileName(
				user.id,
				body.repoId,
				body.fileName
			);

			if (existingEnv) {
				return ctx.json({ error: 'Environment already exists' }, HTTP_CONFLICT);
			}

			const envCount = await envService.getEnvironmentCountByRepo(user.id, body.repoId);
			if (envCount >= MAX_ENVS_PER_REPO) {
				return ctx.json(
					{ error: `Environment file limit reached for this repository (max ${MAX_ENVS_PER_REPO})` },
					HTTP_FORBIDDEN
				);
			}

			const result = await envService.createEnvironment(user.id, body);

			return ctx.json(result, HTTP_CREATED);
		} catch (error) {
			logger.error('Failed to create environment', { error });
			return ctx.json(
				{ error: 'Failed to create environment' },
				HTTP_INTERNAL_SERVER_ERROR
			);
		}
	}
);
