import { honoFactory } from '@/shared/utils/factory';
import { UserService } from './user.service';
import { HTTPException } from 'hono/http-exception';

/**
 * DELETE /api/v1/user/repositories
 * Deletes all repositories and environments for the authenticated user.
 * Critical destructive action.
 */
export const deleteUserRepositoriesHandler = honoFactory.createHandlers(async (c) => {
	const user = c.get('user');
	if (!user?.id) {
		throw new HTTPException(401, { message: 'Unauthorized' });
	}

	const deleted = await UserService.deleteAllRepositories(user.id);

	return c.json({
		success: true,
		deletedCount: deleted.length,
	});
});
