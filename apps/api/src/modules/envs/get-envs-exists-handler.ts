import { honoFactory } from "@/shared/utils/factory";
import { customZValidator } from "@/shared/utils/zod-validator";
import { authMiddleware } from "@/shared/middleware/auth.middleware";
import {
  HTTP_UNAUTHORIZED,
  HTTP_INTERNAL_SERVER_ERROR,
} from "@/shared/constants/http-status";
import { EnvService } from "./env.service";
import { envExistsQuerySchema } from "./env.schemas";
import { logger } from "@/shared/utils/logger";

const envService = new EnvService();

export const getEnvExistsHandler = honoFactory.createHandlers(
  customZValidator("query", envExistsQuerySchema),
  authMiddleware,
  async (ctx) => {
    const user = ctx.get("user");
    if (!user) {
      return ctx.json({ error: "Unauthorized" }, HTTP_UNAUTHORIZED);
    }

    try {
      const { repoId, fileName } = ctx.req.valid("query");
      const result = await envService.getEnvironmentByFileName(
        user.id,
        repoId,
        fileName,
      );
      return ctx.json({ exists: !!result });
    } catch (error) {
      logger.error("Failed to check environment existence", {
        error: error instanceof Error ? error.message : String(error),
      });
      return ctx.json(
        { error: "Failed to check environment" },
        HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  },
);
