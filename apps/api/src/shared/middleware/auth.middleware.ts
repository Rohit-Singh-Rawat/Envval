import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppEnv } from "@/shared/types/context";
import { HTTP_UNAUTHORIZED } from "@/shared/constants/http-status";

/**
 * Authentication middleware - ensures user and session exist.
 * Must be applied after sessionMiddleware which populates user/session.
 */
export const authMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const user = c.get("user");
  const session = c.get("session");

  if (!user || !session) {
    throw new HTTPException(HTTP_UNAUTHORIZED, { message: "Unauthorized" });
  }

  await next();
};
