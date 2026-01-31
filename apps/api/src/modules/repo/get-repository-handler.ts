import { honoFactory } from '@/shared/utils/factory';
import { customZValidator } from '@/shared/utils/zod-validator';
import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { HTTP_NOT_FOUND, HTTP_UNAUTHORIZED } from '@/shared/constants/http-status';
import { RepoService } from './repo.service';
import { repoParamSchema } from './repo.schemas';

const repoService = new RepoService();

export const getRepositoryHandler = honoFactory.createHandlers(
	customZValidator('param', repoParamSchema),
	authMiddleware,
	async (ctx) => {
		const user = ctx.get('user');
		if (!user) {
			return ctx.json({ error: 'Unauthorized' }, HTTP_UNAUTHORIZED);
		}

		const { repoId } = ctx.req.valid('param');
		const repository = await repoService.getRepositorySummary(user.id, repoId);

		if (!repository) {
			return ctx.json({ error: 'Repository not found' }, HTTP_NOT_FOUND);
		}

		return ctx.json(repository);
	}
);
