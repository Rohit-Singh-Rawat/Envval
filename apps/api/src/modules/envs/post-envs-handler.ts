import { honoFactory } from '@/shared/utils/factory';
import { customZValidator } from '@/shared/utils/zod-validator';
import { authMiddleware } from '@/shared/middleware/auth.middleware';
import {
	HTTP_UNAUTHORIZED,
	HTTP_CREATED,
	HTTP_CONFLICT,
	HTTP_INTERNAL_SERVER_ERROR,
} from '@/shared/constants/http-status';
import { EnvService } from './env.service';
import { createEnvSchema } from './env.schemas';

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

			// Check if environment already exists for this repo and file name
			const existingEnv = await envService.getEnvironmentByFileName(
				user.id,
				body.repoId,
				body.fileName
			);

			if (existingEnv) {
				return ctx.json({ error: 'Environment already exists' }, HTTP_CONFLICT);
			}

			const result = await envService.createEnvironment(user.id, body);

			return ctx.json(result, HTTP_CREATED);
		} catch (error) {
			console.error('Failed to create environment:', error);
			return ctx.json(
				{ error: 'Failed to create environment' },
				HTTP_INTERNAL_SERVER_ERROR
			);
		}
	}
);
