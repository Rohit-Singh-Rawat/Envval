import { honoFactory } from '@/shared/utils/factory';
import { customZValidator } from '@/shared/utils/zod-validator';
import { authMiddleware } from '@/shared/middleware/auth.middleware';
import {
	HTTP_CREATED,
	HTTP_CONFLICT,
	HTTP_UNAUTHORIZED,
	HTTP_FORBIDDEN,
} from '@/shared/constants/http-status';
import { MAX_REPOS_PER_USER } from '@/shared/constants/system-limits';
import { RepoService } from './repo.service';
import { repoCreateBodySchema } from './repo.schemas';
import { AuthEmailService } from '@/modules/auth/auth-email.service';
import { logger } from '@/shared/utils/logger';

const repoService = new RepoService();
const emailService = new AuthEmailService();

export const postRepositoriesHandler = honoFactory.createHandlers(
	customZValidator('json', repoCreateBodySchema),
	authMiddleware,
	async (ctx) => {
		const user = ctx.get('user');
		if (!user) {
			return ctx.json({ error: 'Unauthorized' }, HTTP_UNAUTHORIZED);
		}

		const { repoId, name, gitRemoteUrl, workspacePath } = ctx.req.valid('json');

		const repoCount = await repoService.getRepositoryCount(user.id);
		if (repoCount >= MAX_REPOS_PER_USER) {
			return ctx.json(
				{ error: `Repository limit reached (max ${MAX_REPOS_PER_USER})` },
				HTTP_FORBIDDEN
			);
		}

		try {
			const repository = await repoService.createRepository(user.id, {
				id: repoId,
				name,
				gitRemoteUrl,
				workspacePath,
			});

			let preferences = (user as Record<string, unknown>).notificationPreferences;
			if (typeof preferences === 'string') {
				try {
					preferences = JSON.parse(preferences);
				} catch {
					preferences = { newRepoAdded: true, newDeviceLogin: true };
				}
			}

			const prefs = preferences as { newRepoAdded: boolean } | undefined;

			if (prefs?.newRepoAdded) {
				emailService.sendNewRepoEmail(user.email, user.name, name, gitRemoteUrl || undefined).catch((err) => {
					logger.error('Failed to send new repo email', { error: err });
				});
			}

			return ctx.json({ repository }, HTTP_CREATED);
		} catch (error) {
			if (error instanceof Error && error.message.includes('unique')) {
				return ctx.json({ error: 'Repository already exists' }, HTTP_CONFLICT);
			}

			throw error;
		}
	}
);
