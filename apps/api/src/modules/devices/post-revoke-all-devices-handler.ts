import { honoFactory } from '@/shared/utils/factory';
import { DeviceService } from './device.service';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { rateLimitMiddleware } from '@/shared/middleware/rate-limit.middleware';
import { logger } from '@/shared/utils/logger';

const revokeAllBodySchema = z.object({
	exceptDeviceId: z.string().min(1),
});

/**
 * POST /api/v1/devices/revoke-all
 * Deletes all devices except the specified one atomically.
 * Critical security action for compromised accounts.
 * Returns metadata about deleted devices and sessions for audit logging.
 */
export const postRevokeAllDevicesHandler = honoFactory.createHandlers(
	rateLimitMiddleware({ tier: 'sensitive' }),
	zValidator('json', revokeAllBodySchema),
	async (c) => {
		const user = c.get('user');
		if (!user?.id) {
			throw new HTTPException(401, { message: 'Unauthorized' });
		}

		const { exceptDeviceId } = c.req.valid('json');

		// Verify the "except" device belongs to user
		const exceptDevice = await DeviceService.getDeviceById(exceptDeviceId);
		if (!exceptDevice || exceptDevice.userId !== user.id) {
			throw new HTTPException(403, {
				message: 'Invalid device ID or device does not belong to user',
			});
		}

		const result = await DeviceService.deleteAllDevicesExcept(user.id, exceptDeviceId);

		logger.warn('Revoked all devices except one', {
			userId: user.id,
			exceptDeviceId,
			exceptDeviceName: exceptDevice.name,
			devicesDeleted: result.devicesDeleted,
			sessionsDeleted: result.sessionsDeleted,
		});

		return c.json({
			success: true,
			devicesDeleted: result.devicesDeleted,
			sessionsDeleted: result.sessionsDeleted,
			devices: result.devices,
		});
	}
);
