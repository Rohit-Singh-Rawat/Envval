import { honoFactory } from '@/shared/utils/factory';
import { UserService } from './user.service';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const updateProfileSchema = z.object({
	displayName: z.string().min(1).max(50).optional(),
	avatar: z
		.enum([
			'avatar-1',
			'avatar-2',
			'avatar-3',
			'avatar-4',
			'avatar-5',
			'avatar-6',
			'avatar-7',
			'avatar-8',
			'avatar-9',
			'avatar-10',
			'avatar-11',
			'avatar-12',
		])
		.optional(),
});

/**
 * PATCH /api/v1/user/profile
 * Updates user display name and/or avatar.
 */
export const patchUserProfileHandler = honoFactory.createHandlers(
	zValidator('json', updateProfileSchema),
	async (c) => {
		const user = c.get('user');
		if (!user?.id) {
			throw new HTTPException(401, { message: 'Unauthorized' });
		}

		const data = c.req.valid('json');

		if (!data.displayName && !data.avatar) {
			throw new HTTPException(400, { message: 'At least one field must be provided' });
		}

		const updated = await UserService.updateProfile(user.id, data);

		return c.json({ profile: updated });
	}
);
