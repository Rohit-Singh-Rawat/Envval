import { honoFactory } from '@/shared/utils/factory';
import { customZValidator } from '@/shared/utils/zod-validator';
import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { HTTP_UNAUTHORIZED } from '@/shared/constants/http-status';
import { EnvService } from './env.service';
import { envPaginationSchema } from './env.schemas';

const envService = new EnvService();

export const getEnvsHandler = honoFactory.createHandlers(
	customZValidator('query', envPaginationSchema),
	authMiddleware,
	async (ctx) => {
		const user = ctx.get('user');
		if (!user) {
			return ctx.json({ error: 'Unauthorized' }, HTTP_UNAUTHORIZED);
		}

		const { repoId, includeContent } = ctx.req.valid('query');
		const environments = await envService.getAllEnvironments(user.id, repoId, includeContent);

		return ctx.json({
			environments,
			total: environments.length,
		});
	}
);
