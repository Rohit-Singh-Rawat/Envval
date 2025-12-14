import { honoFactory } from '@/shared/utils/factory';
import { z } from 'zod';
import { customZValidator } from '@/shared/utils/zod-validator';
import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { RepoService } from '@/modules/repo/repo.service';

const repoService = new RepoService();

const querySchema = z.object({
	page: z.coerce.number().optional(),
	limit: z.coerce.number().optional(),
});

export const getRepositoriesHandler = honoFactory.createHandlers(
	customZValidator('query', querySchema),
	authMiddleware,
	async (ctx) => {
		const user = ctx.get('user');
		const { page = 1, limit = 10 } = ctx.req.valid('query');
		const repositories = await repoService.getRepositories(user!.id, page, limit);
		return ctx.json(repositories);
	}
);
