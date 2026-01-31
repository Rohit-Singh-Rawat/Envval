import { honoFactory } from '@/shared/utils/factory';
import { customZValidator } from '@/shared/utils/zod-validator';
import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { HTTP_NOT_FOUND, HTTP_UNAUTHORIZED } from '@/shared/constants/http-status';
import { RepoService } from './repo.service';
import { repoEnvParamSchema } from './repo.schemas';

const repoService = new RepoService();

export const getRepositoriesEnvHandler = honoFactory.createHandlers(
	customZValidator('param', repoEnvParamSchema),
	authMiddleware,
	async (ctx) => {
		const user = ctx.get('user');
		if (!user) {
			return ctx.json({ error: 'Unauthorized' }, HTTP_UNAUTHORIZED);
		}

		const { repoId } = ctx.req.valid('param');
		const environments = await repoService.getEnvironments(user.id, repoId);

		if (environments.length === 0) {
			return ctx.json({ error: 'No environments found' }, HTTP_NOT_FOUND);
		}

		return ctx.json({
			environments,
			total: environments.length,
		});
	}
);
