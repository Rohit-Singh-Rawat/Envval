import { db } from "@envval/db";
import { device, session } from "@envval/db/schema";
import { eq, and, ne, inArray } from "drizzle-orm";

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
    const [result] = await db
      .select()
      .from(device)
      .where(eq(device.id, deviceId))
      .limit(1);

    return result || null;
  }

  /**
   * Deletes a specific device and all its sessions atomically.
   * Uses a transaction to ensure both operations succeed or fail together.
   * Returns metadata about deleted sessions for audit logging.
   */
  static async deleteDevice(deviceId: string) {
    return await db.transaction(async (tx) => {
      // First, count and delete all sessions for this device
      const sessionsToDelete = await tx
        .select({ id: session.id })
        .from(session)
        .where(eq(session.deviceId, deviceId));

      const sessionCount = sessionsToDelete.length;

      if (sessionCount > 0) {
        await tx.delete(session).where(eq(session.deviceId, deviceId));
      }

      // Then delete the device
      const [deleted] = await tx
        .delete(device)
        .where(eq(device.id, deviceId))
        .returning();

      return {
        device: deleted,
        sessionsDeleted: sessionCount,
      };
    });
  }

  /**
   * Deletes all devices for a user except the specified device atomically.
   * Uses a transaction to ensure all operations succeed or fail together.
   * Critical security action typically used when account is compromised.
   * Returns metadata about deleted devices and sessions for audit logging.
   */
  static async deleteAllDevicesExcept(userId: string, exceptDeviceId: string) {
    return await db.transaction(async (tx) => {
      // First, get the device IDs that will be deleted
      const devicesToDelete = await tx
        .select({ id: device.id, name: device.name })
        .from(device)
        .where(and(eq(device.userId, userId), ne(device.id, exceptDeviceId)));

      const deviceIds = devicesToDelete.map((d) => d.id);

      if (deviceIds.length === 0) {
        return {
          devices: [],
          devicesDeleted: 0,
          sessionsDeleted: 0,
        };
      }

      // Count sessions that will be deleted
      const sessionsToDelete = await tx
        .select({ id: session.id })
        .from(session)
        .where(inArray(session.deviceId, deviceIds));

      const sessionCount = sessionsToDelete.length;

      // Delete all sessions for these devices
      if (sessionCount > 0) {
        await tx.delete(session).where(inArray(session.deviceId, deviceIds));
      }

      // Delete the devices
      const deleted = await tx
        .delete(device)
        .where(inArray(device.id, deviceIds))
        .returning();

      return {
        devices: deleted,
        devicesDeleted: deleted.length,
        sessionsDeleted: sessionCount,
      };
    });
  }

  /**
   * Updates device metadata (last seen timestamp, IP, user agent).
   * Called during authentication refresh to track device activity.
   */
  static async updateDeviceActivity(
    deviceId: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
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
