import { honoFactory } from '@/shared/utils/factory';
import { customZValidator } from '@/shared/utils/zod-validator';
import { authMiddleware } from '@/shared/middleware/auth.middleware';
import {
	HTTP_CREATED,
	HTTP_CONFLICT,
	HTTP_UNAUTHORIZED,
	HTTP_INTERNAL_SERVER_ERROR,
} from '@/shared/constants/http-status';
import { RepoService } from './repo.service';
import { repoCreateBodySchema } from './repo.schemas';

const repoService = new RepoService();

export const postRepositoriesHandler = honoFactory.createHandlers(
	customZValidator('json', repoCreateBodySchema),
	authMiddleware,
	async (ctx) => {
		const user = ctx.get('user');
		if (!user) {
			return ctx.json({ error: 'Unauthorized' }, HTTP_UNAUTHORIZED);
		}

		const { repoId, gitRemoteUrl, workspacePath } = ctx.req.valid('json');

		try {
			const repository = await repoService.createRepository(user.id, {
				id: repoId,
				gitRemoteUrl,
				workspacePath,
			});

			return ctx.json({ repository }, HTTP_CREATED);
		} catch (error) {
			// Handle unique constraint violation (repo already exists)
			if (error instanceof Error && error.message.includes('unique')) {
				return ctx.json({ error: 'Repository already exists' }, HTTP_CONFLICT);
			}

			throw error; // Let error middleware handle unexpected errors
		}
	}
);
