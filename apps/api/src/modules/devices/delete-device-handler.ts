import { honoFactory } from "@/shared/utils/factory";
import { DeviceService } from "./device.service";
import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { logger } from "@/shared/utils/logger";

const deleteDeviceParamsSchema = z.object({
  deviceId: z.string().min(1),
});

/**
 * DELETE /api/v1/devices/:deviceId
 * Deletes a specific device and all its sessions atomically.
 * Returns metadata about deleted sessions for audit logging.
 */
export const deleteDeviceHandler = honoFactory.createHandlers(
  zValidator("param", deleteDeviceParamsSchema),
  async (c) => {
    const user = c.get("user");
    if (!user?.id) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    const { deviceId } = c.req.valid("param");

    // Verify device belongs to user
    const deviceToDelete = await DeviceService.getDeviceById(deviceId);
    if (!deviceToDelete) {
      throw new HTTPException(404, { message: "Device not found" });
    }

    if (deviceToDelete.userId !== user.id) {
      throw new HTTPException(403, { message: "Forbidden" });
    }

    const result = await DeviceService.deleteDevice(deviceId);

    logger.info("Device deleted", {
      userId: user.id,
      deviceId,
      deviceName: result.device.name,
      sessionsDeleted: result.sessionsDeleted,
    });

    return c.json({
      success: true,
      device: result.device,
      sessionsDeleted: result.sessionsDeleted,
    });
  },
);
