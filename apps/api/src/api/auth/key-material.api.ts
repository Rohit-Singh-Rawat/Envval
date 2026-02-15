import { honoFactory } from '@/shared/utils/factory';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { KeyMaterialService } from '@/modules/auth/key-material.service';
import { authMiddleware } from '@/shared/middleware/auth.middleware';
import { MAX_PUBLIC_KEY_LENGTH } from '@/shared/constants/system-limits';
import { logger } from '@/shared/utils/logger';

const keyMaterialService = new KeyMaterialService();

const keyMaterialSchema = z.object({
	publicKey: z.string().min(1, 'Public key is required').max(MAX_PUBLIC_KEY_LENGTH),
});

export const keyMaterialApi = honoFactory
	.createApp()
	.post('/', zValidator('json', keyMaterialSchema), authMiddleware, async (c) => {
		const session = c.get('session');
		
		// authMiddleware ensures user exists, but session needs explicit check 
		// if the middleware type definition allows it to be nullable.
		if (!session) {
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
				return c.json({ error: message }, 409);
			}
			if (message.includes('not found') || message.includes('not initialized')) {
				return c.json({ error: message }, 404);
			}

			logger.error('Key material error', { error });
			return c.json({ error: 'Internal server error' }, 500);
		}
	});
