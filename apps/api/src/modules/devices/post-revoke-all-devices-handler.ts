import { honoFactory } from '@/shared/utils/factory';
import { DeviceService } from './device.service';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const revokeAllBodySchema = z.object({
	exceptDeviceId: z.string().min(1),
});

/**
 * POST /api/v1/devices/revoke-all
 * Deletes all devices except the specified one.
 * Critical security action for compromised accounts.
 */
export const postRevokeAllDevicesHandler = honoFactory.createHandlers(
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

		const deletedDevices = await DeviceService.deleteAllDevicesExcept(
			user.id,
			exceptDeviceId
		);

		return c.json({
			success: true,
			deletedCount: deletedDevices.length,
			deletedDevices,
		});
	}
);
