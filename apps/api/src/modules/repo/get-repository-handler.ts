import { honoFactory } from '@/shared/utils/factory';
import { z } from 'zod';
import { customZValidator } from '@/shared/utils/zod-validator';
import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { RepoService } from '@/modules/repo/repo.service';

const repoService = new RepoService();

const paramSchema = z.object({
	repoId: z.string().uuid(),
});

export const getRepositoryHandler = honoFactory.createHandlers(
	customZValidator('param', paramSchema),
	authMiddleware,
	async (ctx) => {
		const user = ctx.get('user');
		const { repoId } = ctx.req.valid('param');
		const repository = await repoService.getRepositorySummary(user!.id, repoId);
		if (!repository) {
			return ctx.json({ error: 'Repository not found' }, 404);
		}
		return ctx.json(repository);
	}
);
