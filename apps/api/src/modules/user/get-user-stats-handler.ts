import { honoFactory } from '@/shared/utils/factory';
import { UserService } from './user.service';
import { HTTPException } from 'hono/http-exception';

/**
 * GET /api/v1/user/stats
 * Returns user statistics: repo count, env count, last activity, account creation date.
 */
export const getUserStatsHandler = honoFactory.createHandlers(async (c) => {
	const user = c.get('user');
	if (!user?.id) {
		throw new HTTPException(401, { message: 'Unauthorized' });
	}

	const stats = await UserService.getUserStats(user.id);

	return c.json({ stats });
});
