import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "@/shared/types/context";
import { auth } from "@/modules/auth/auth.service";

/**
 * Session middleware - retrieves session from request headers.
 * Populates user and session in context for downstream middleware/handlers.
 * Does not enforce authentication - use authMiddleware for protected routes.
 */
export const sessionMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.set("user", null);
    c.set("session", null);
    await next();
    return;
  }

  c.set("user", session.user);
  c.set("session", session.session);
  await next();
};
