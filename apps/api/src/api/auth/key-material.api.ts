import { honoFactory } from '@/shared/utils/factory';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { KeyMaterialService } from '@/modules/auth/key-material.service';

const keyMaterialService = new KeyMaterialService();

const keyMaterialSchema = z.object({
	publicKey: z.string().min(1, 'Public key is required'),
});

export const keyMaterialApi = honoFactory
	.createApp()
	.post('/', zValidator('json', keyMaterialSchema), async (c) => {
		const session = c.get('session');
		const user = c.get('user');
    console.log(user, session);

		if (!user || !session) {
			return c.json({ error: 'Unauthorized' }, 401);
		}

		const { publicKey } = c.req.valid('json');

		try {
			const wrappedUserKey = await keyMaterialService.getWrappedKeyMaterialForSession(
				session.id,
				publicKey
			);

			return c.json({
				wrappedUserKey,
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to get key material';

			if (message.includes('already been delivered')) {
				return c.json({ error: message }, 409); // Conflict
			}
			if (message.includes('not found') || message.includes('not initialized')) {
				return c.json({ error: message }, 404); // Not Found
			}

			console.error('Key material error:', error);
			return c.json({ error: 'Internal server error' }, 500);
		}
	});
