import { honoFactory } from '@/shared/utils/factory';
import { DeviceService } from './device.service';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const deleteDeviceParamsSchema = z.object({
	deviceId: z.string().min(1),
});

/**
 * DELETE /api/v1/devices/:deviceId
 * Deletes a specific device and all its sessions.
 */
export const deleteDeviceHandler = honoFactory.createHandlers(
	zValidator('param', deleteDeviceParamsSchema),
	async (c) => {
		const user = c.get('user');
		if (!user?.id) {
			throw new HTTPException(401, { message: 'Unauthorized' });
		}

		const { deviceId } = c.req.valid('param');

		// Verify device belongs to user
		const deviceToDelete = await DeviceService.getDeviceById(deviceId);
		if (!deviceToDelete) {
			throw new HTTPException(404, { message: 'Device not found' });
		}

		if (deviceToDelete.userId !== user.id) {
			throw new HTTPException(403, { message: 'Forbidden' });
		}

		const deletedDevice = await DeviceService.deleteDevice(deviceId);

		return c.json({
			success: true,
			device: deletedDevice,
		});
	}
);
