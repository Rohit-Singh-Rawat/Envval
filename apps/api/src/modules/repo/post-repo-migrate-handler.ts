import { honoFactory } from '@/shared/utils/factory';
import { authMiddleware } from '@/shared/middleware/auth.middleware';
import {
	HTTP_UNAUTHORIZED,
	HTTP_BAD_REQUEST,
	HTTP_INTERNAL_SERVER_ERROR,
} from '@/shared/constants/http-status';
import { RepoService } from './repo.service';
import { z } from 'zod';
import { customZValidator } from '@/shared/utils/zod-validator';

const repoService = new RepoService();

const migrateSchema = z.object({
	oldRepoId: z.string(),
	newRepoId: z.string(),
	gitRemoteUrl: z.string().optional(),
});

/**
 * POST /api/v1/repos/migrate
 * Migrates a repository from one repoId to another.
 * Updates associated environment records to point to the new ID.
 */
export const postRepoMigrateHandler = honoFactory.createHandlers(
	customZValidator('json', migrateSchema),
	authMiddleware,
	async (ctx) => {
		const user = ctx.get('user');
		if (!user) {
			return ctx.json({ error: 'Unauthorized' }, HTTP_UNAUTHORIZED);
		}

		try {
			const { oldRepoId, newRepoId, gitRemoteUrl } = ctx.req.valid('json');

			if (oldRepoId === newRepoId) {
				return ctx.json({ success: true, message: 'Source and target IDs are the same' });
			}

			await repoService.migrateRepository(user.id, oldRepoId, newRepoId, gitRemoteUrl);

			return ctx.json({ success: true, oldRepoId, newRepoId });
		} catch (error: any) {
			console.error('Failed to migrate repository:', error);
			return ctx.json(
				{ error: error.message || 'Failed to migrate repository' },
				HTTP_BAD_REQUEST
			);
		}
	}
);
