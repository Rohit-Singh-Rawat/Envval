import { honoFactory } from "@/shared/utils/factory";
import { customZValidator } from "@/shared/utils/zod-validator";
import { authMiddleware } from "@/shared/middleware/auth.middleware";
import {
  HTTP_UNAUTHORIZED,
  HTTP_NOT_FOUND,
  HTTP_INTERNAL_SERVER_ERROR,
  HTTP_NO_CONTENT,
} from "@/shared/constants/http-status";
import { EnvService } from "./env.service";
import { envIdParamSchema } from "./env.schemas";
import { logger } from "@/shared/utils/logger";

const envService = new EnvService();

export const deleteEnvHandler = honoFactory.createHandlers(
  customZValidator("param", envIdParamSchema),
  authMiddleware,
  async (ctx) => {
    const user = ctx.get("user");
    if (!user) {
      return ctx.json({ error: "Unauthorized" }, HTTP_UNAUTHORIZED);
    }

    try {
      const { envId } = ctx.req.valid("param");
      const result = await envService.deleteEnvironment(user.id, envId);

      if (!result) {
        return ctx.json({ error: "Environment not found" }, HTTP_NOT_FOUND);
      }

      return new Response(null, { status: HTTP_NO_CONTENT });
    } catch (error) {
      logger.error("Failed to delete environment", { error });
      return ctx.json(
        { error: "Failed to delete environment" },
        HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  },
);
