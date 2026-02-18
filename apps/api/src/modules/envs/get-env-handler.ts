import { honoFactory } from '@/shared/utils/factory';
import { customZValidator } from '@/shared/utils/zod-validator';
import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { HTTP_UNAUTHORIZED, HTTP_NOT_FOUND, HTTP_INTERNAL_SERVER_ERROR } from '@/shared/constants/http-status';
import { EnvService } from './env.service';
import { envIdParamSchema } from './env.schemas';
import { logger } from '@/shared/utils/logger';

const envService = new EnvService();

export const getEnvHandler = honoFactory.createHandlers(
	customZValidator('param', envIdParamSchema),
	authMiddleware,
	async (ctx) => {
		const user = ctx.get('user');
		if (!user) {
			return ctx.json({ error: 'Unauthorized' }, HTTP_UNAUTHORIZED);
		}

		try {
			const { envId } = ctx.req.valid('param');
			const result = await envService.getEnvironmentById(user.id, envId);

			if (!result) {
				return ctx.json({ error: 'Environment not found' }, HTTP_NOT_FOUND);
			}

			return ctx.json(result);
		} catch (error) {
			logger.error('Failed to get environment', { error: error instanceof Error ? error.message : String(error) });
			return ctx.json(
				{ error: 'Failed to retrieve environment' },
				HTTP_INTERNAL_SERVER_ERROR
			);
		}
	}
);
