import { honoFactory } from '@/shared/utils/factory';
import { z } from 'zod';
import { customZValidator } from '@/shared/utils/zod-validator';
import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { RepoService } from '@/modules/repo/repo.service';

const repoService = new RepoService();

const paramSchema = z.object({
	repoId: z.string().uuid(),
});

export const getRepositoriesEnvHandler = honoFactory.createHandlers(
	customZValidator('param', paramSchema),
	authMiddleware,
	async (ctx) => {
		const user = ctx.get('user');
		const { repoId } = ctx.req.valid('param');
		const environments = await repoService.getEnvironments(user!.id, repoId);
		if (environments.length === 0) {
			return ctx.json({ error: 'No environments found' }, 404);
		}
		return ctx.json({
			environments,
			total: environments.length,
			page: 1,
			limit: 10,
		});
	}
);
