import { honoFactory } from '@/shared/utils/factory';
import { UserService } from './user.service';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const notificationsSchema = z.object({
	newRepoAdded: z.boolean(),
	newDeviceLogin: z.boolean(),
});

/**
 * PATCH /api/v1/user/notifications
 * Updates user notification preferences.
 */
export const patchUserNotificationsHandler = honoFactory.createHandlers(
	zValidator('json', notificationsSchema),
	async (c) => {
		const user = c.get('user');
		if (!user?.id) {
			throw new HTTPException(401, { message: 'Unauthorized' });
		}

		const preferences = c.req.valid('json');
		await UserService.updateNotificationPreferences(user.id, preferences);

		return c.json({ success: true, preferences });
	}
);
