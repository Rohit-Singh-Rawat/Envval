import { honoFactory } from "@/shared/utils/factory";
import { UserService } from "./user.service";
import { HTTPException } from "hono/http-exception";

/**
 * GET /api/v1/user/profile
 * Returns user profile with display name, avatar, and notification preferences.
 */
export const getUserProfileHandler = honoFactory.createHandlers(async (c) => {
  const user = c.get("user");
  if (!user?.id) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  const profile = await UserService.getUserProfile(user.id);
  if (!profile) {
    throw new HTTPException(404, { message: "User not found" });
  }

  return c.json({ profile });
});
