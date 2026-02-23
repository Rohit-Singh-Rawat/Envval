import { honoFactory } from "@/shared/utils/factory";
import { UserService } from "./user.service";
import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { rateLimitMiddleware } from "@/shared/middleware/rate-limit.middleware";

const deleteAccountSchema = z.object({
  confirmation: z.string().min(1),
});

/**
 * DELETE /api/v1/user/account
 * Permanently deletes user account and all associated data.
 * Critical destructive action - requires confirmation string.
 */
export const deleteUserAccountHandler = honoFactory.createHandlers(
  rateLimitMiddleware({ tier: "sensitive" }),
  zValidator("json", deleteAccountSchema),
  async (c) => {
    const user = c.get("user");
    if (!user?.id) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    const { confirmation } = c.req.valid("json");

    // Validate confirmation string matches user email or "DELETE"
    if (confirmation !== user.email && confirmation !== "DELETE") {
      throw new HTTPException(400, {
        message: "Confirmation text does not match",
      });
    }

    await UserService.deleteAccount(user.id);

    return c.json({ success: true });
  },
);
