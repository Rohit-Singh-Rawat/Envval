import { honoFactory } from '@/shared/utils/factory';
import { customZValidator } from '@/shared/utils/zod-validator';
import { authMiddleware } from '@/shared/middleware/auth.middleware';
import {
	HTTP_CREATED,
	HTTP_CONFLICT,
	HTTP_UNAUTHORIZED,
} from '@/shared/constants/http-status';
import { RepoService } from './repo.service';
import { repoCreateBodySchema } from './repo.schemas';

import { AuthEmailService } from '@/modules/auth/auth-email.service';

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

		try {
			const repository = await repoService.createRepository(user.id, {
				id: repoId,
				name,
				gitRemoteUrl,
				workspacePath,
			});

			// Send notification email if enabled
			// Handle potential JSON string parsing for preferences
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			let preferences = (user as any).notificationPreferences;
			if (typeof preferences === 'string') {
				try {
					preferences = JSON.parse(preferences);
				} catch (e) {
					// Fallback to default if parsing fails
					preferences = { newRepoAdded: true, newDeviceLogin: true };
				}
			}

			// Force type assertion as user type might be loose
			const prefs = preferences as { newRepoAdded: boolean };

			if (prefs?.newRepoAdded) {
				// Don't await email sending to avoid blocking the response
				emailService.sendNewRepoEmail(user.email, user.name, name, gitRemoteUrl || undefined).catch((err) => {
					console.error('Failed to send new repo email:', err);
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
