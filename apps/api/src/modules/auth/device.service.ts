import { db } from "@envval/db";
import { device, deviceType } from "@envval/db/schema";
import { and, count, eq } from "drizzle-orm";
import { z } from "zod";
import { MAX_DEVICES_PER_USER } from "@/shared/constants/system-limits";

const deviceMetaSchema = z.object({
  name: z.string().optional(),
  lastIpAddress: z.string().nullable().optional(),
  lastUserAgent: z.string().nullable().optional(),
});

type DeviceMeta = z.infer<typeof deviceMetaSchema>;

export class DeviceService {
  async getDeviceCountByUserId(userId: string): Promise<number> {
    const [result] = await db
      .select({ value: count() })
      .from(device)
      .where(eq(device.userId, userId));
    return result?.value ?? 0;
  }

  async ensureExists(
    deviceId: string,
    userId: string,
    type: (typeof deviceType.enumValues)[number] = "DEVICE_EXTENSION",
    meta: DeviceMeta = {},
  ) {
    const { name, lastIpAddress, lastUserAgent } = deviceMetaSchema.parse(meta);

    const existingDevice = await db
      .select()
      .from(device)
      .where(and(eq(device.id, deviceId), eq(device.userId, userId)))
      .limit(1);

    if (existingDevice.length === 0) {
      // Enforce per-user device quota before creating a new record
      const deviceCount = await this.getDeviceCountByUserId(userId);
      if (deviceCount >= MAX_DEVICES_PER_USER) {
        throw new Error(`Device limit reached (max ${MAX_DEVICES_PER_USER})`);
      }

      const newDevice = {
        id: deviceId,
        userId,
        name: name ?? deviceId.split("-")[1] ?? deviceId,
        type,
        lastIpAddress,
        lastUserAgent,
        lastSeenAt: new Date(),
      };
      await db.insert(device).values(newDevice);
      return newDevice;
    }

    // Build update object from defined values only
    const updateData = Object.fromEntries(
      Object.entries({ name, lastIpAddress, lastUserAgent }).filter(
        ([, v]) => v !== undefined,
      ),
    ) as Partial<typeof device.$inferInsert>;

    if (Object.keys(updateData).length > 0) {
      updateData.lastSeenAt = new Date();
      await db.update(device).set(updateData).where(eq(device.id, deviceId));
      const updated = await db
        .select()
        .from(device)
        .where(eq(device.id, deviceId))
        .limit(1);
      return updated[0] ?? existingDevice[0];
    }

    return existingDevice[0];
  }
}
