import { honoFactory } from '@/shared/utils/factory';
import { customZValidator } from '@/shared/utils/zod-validator';
import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { HTTP_UNAUTHORIZED } from '@/shared/constants/http-status';
import { RepoService } from './repo.service';
import { repoParamSchema, envQuerySchema } from './repo.schemas';

const repoService = new RepoService();

export const getRepositoriesEnvHandler = honoFactory.createHandlers(
	customZValidator('param', repoParamSchema),
	customZValidator('query', envQuerySchema),
	authMiddleware,
	async (ctx) => {
		const user = ctx.get('user');
		if (!user) {
			return ctx.json({ error: 'Unauthorized' }, HTTP_UNAUTHORIZED);
		}

		const { repoId } = ctx.req.valid('param');
		const { includeContent } = ctx.req.valid('query');
		const environments = await repoService.getEnvironments(user.id, repoId, includeContent);

		return ctx.json({
			environments,
			total: environments.length,
		});
	}
);
