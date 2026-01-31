import { honoFactory } from '@/shared/utils/factory';
import { customZValidator } from '@/shared/utils/zod-validator';
import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { HTTP_UNAUTHORIZED, HTTP_NOT_FOUND, HTTP_INTERNAL_SERVER_ERROR } from '@/shared/constants/http-status';
import { EnvService } from './env.service';
import { envIdParamSchema, updateEnvSchema } from './env.schemas';

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

			return ctx.json(result);
		} catch (error) {
			console.error('Failed to update environment:', error);
			return ctx.json(
				{ error: 'Failed to update environment' },
				HTTP_INTERNAL_SERVER_ERROR
			);
		}
	}
);
