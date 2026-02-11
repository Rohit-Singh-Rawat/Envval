import { db } from '@envval/db';
import { device, session } from '@envval/db/schema';
import { eq, and, ne, inArray } from 'drizzle-orm';

export class DeviceService {
	/**
	 * Retrieves all active devices for a specific user.
	 * Only returns devices that exist (have active sessions).
	 */
	static async getDevicesByUserId(userId: string) {
		return await db
			.select()
			.from(device)
			.where(eq(device.userId, userId))
			.orderBy(device.lastSeenAt);
	}

	/**
	 * Retrieves a single device by its ID.
	 * Returns null if device doesn't exist.
	 */
	static async getDeviceById(deviceId: string) {
		const [result] = await db.select().from(device).where(eq(device.id, deviceId)).limit(1);

		return result || null;
	}

	/**
	 * Deletes a specific device and all its sessions.
	 * Completely removes the device from the system.
	 */
	static async deleteDevice(deviceId: string) {
		// Delete all sessions for this device first
		await db.delete(session).where(eq(session.deviceId, deviceId));

		// Delete the device
		const [deleted] = await db.delete(device).where(eq(device.id, deviceId)).returning();

		return deleted;
	}

	/**
	 * Deletes all devices for a user except the specified device.
	 * Also deletes all sessions associated with those devices.
	 * Critical security action typically used when account is compromised.
	 */
	static async deleteAllDevicesExcept(userId: string, exceptDeviceId: string) {
		// First, get the device IDs that will be deleted
		const devicesToDelete = await db
			.select({ id: device.id })
			.from(device)
			.where(and(eq(device.userId, userId), ne(device.id, exceptDeviceId)));

		const deviceIds = devicesToDelete.map((d) => d.id);

		if (deviceIds.length > 0) {
			// Delete all sessions for these devices
			await db.delete(session).where(inArray(session.deviceId, deviceIds));

			// Delete the devices
			const deleted = await db.delete(device).where(inArray(device.id, deviceIds)).returning();

			return deleted;
		}

		return [];
	}

	/**
	 * Updates device metadata (last seen timestamp, IP, user agent).
	 * Called during authentication refresh to track device activity.
	 */
	static async updateDeviceActivity(deviceId: string, ipAddress?: string, userAgent?: string) {
		const [updated] = await db
			.update(device)
			.set({
				lastSeenAt: new Date(),
				...(ipAddress && { lastIpAddress: ipAddress }),
				...(userAgent && { lastUserAgent: userAgent }),
			})
			.where(eq(device.id, deviceId))
			.returning();

		return updated;
	}
}
