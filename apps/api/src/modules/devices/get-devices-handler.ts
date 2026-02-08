import { honoFactory } from '@/shared/utils/factory';
import { DeviceService } from './device.service';
import { HTTPException } from 'hono/http-exception';

/**
 * GET /api/v1/devices
 * Returns all devices for the authenticated user.
 */
export const getDevicesHandler = honoFactory.createHandlers(async (c) => {
	const user = c.get('user');
	if (!user?.id) {
		throw new HTTPException(401, { message: 'Unauthorized' });
	}

	// Get current device ID from session metadata if available
	const session = c.get('session');
	const currentDeviceId = session?.deviceId || null;

	const devices = await DeviceService.getDevicesByUserId(user.id);

	return c.json({
		devices,
		currentDeviceId,
	});
});
