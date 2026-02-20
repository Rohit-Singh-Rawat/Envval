import { honoFactory } from '@/shared/utils/factory';
import { customZValidator } from '@/shared/utils/zod-validator';
import { authMiddleware } from '@/shared/middleware/auth.middleware';
import {
	HTTP_UNAUTHORIZED,
	HTTP_NOT_FOUND,
	HTTP_INTERNAL_SERVER_ERROR,
	HTTP_PRECONDITION_FAILED,
} from '@/shared/constants/http-status';
import { EnvService } from './env.service';
import { envIdParamSchema, updateEnvSchema } from './env.schemas';
import { logger } from '@/shared/utils/logger';

const envService = new EnvService();

export const putEnvsHandler = honoFactory.createHandlers(
	customZValidator('param', envIdParamSchema),
	customZValidator('json', updateEnvSchema),
	authMiddleware,
	async (ctx) => {
		const user = ctx.get('user');
		if (!user) {
			return ctx.json({ error: 'Unauthorized' }, HTTP_UNAUTHORIZED);
		}

		try {
			const { envId } = ctx.req.valid('param');
			const body = ctx.req.valid('json');
			const result = await envService.updateEnvironment(user.id, envId, body);

			if (!result) {
				return ctx.json({ error: 'Environment not found' }, HTTP_NOT_FOUND);
			}

			if (!result.success && result.conflict) {
				return ctx.json(
					{
						error: 'precondition_failed',
						message: 'Environment was modified by another device',
						current: {
							latestHash: result.current.latestHash,
							updatedAt: result.current.updatedAt,
							lastUpdatedByDeviceId: result.current.lastUpdatedByDeviceId,
						},
						requested: { baseHash: body.baseHash },
					},
					HTTP_PRECONDITION_FAILED
				);
			}

			if (result.success) {
				return ctx.json(result.env);
			}
			return ctx.json({ error: 'Environment not found' }, HTTP_NOT_FOUND);
		} catch (error) {
			logger.error('Failed to update environment', { error });
			return ctx.json({ error: 'Failed to update environment' }, HTTP_INTERNAL_SERVER_ERROR);
		}
	}
);
