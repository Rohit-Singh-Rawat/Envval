import { honoFactory } from "@/shared/utils/factory";
import { authMiddleware } from "@/shared/middleware/auth.middleware";
import {
  HTTP_UNAUTHORIZED,
  HTTP_BAD_REQUEST,
} from "@/shared/constants/http-status";
import { RepoService } from "./repo.service";
import { z } from "zod";
import { customZValidator } from "@/shared/utils/zod-validator";
import { logger } from "@/shared/utils/logger";

const repoService = new RepoService();

const migrateSchema = z.object({
  oldRepoId: z.string().min(1),
  newRepoId: z.string().min(1),
  gitRemoteUrl: z.string().optional(),
});

export const postRepoMigrateHandler = honoFactory.createHandlers(
  customZValidator("json", migrateSchema),
  authMiddleware,
  async (ctx) => {
    const user = ctx.get("user");
    if (!user) {
      return ctx.json({ error: "Unauthorized" }, HTTP_UNAUTHORIZED);
    }

    try {
      const { oldRepoId, newRepoId, gitRemoteUrl } = ctx.req.valid("json");

      if (oldRepoId === newRepoId) {
        return ctx.json({
          success: true,
          message: "Source and target IDs are the same",
        });
      }

      await repoService.migrateRepository(
        user.id,
        oldRepoId,
        newRepoId,
        gitRemoteUrl,
      );

      return ctx.json({ success: true, oldRepoId, newRepoId });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to migrate repository";
      logger.error("Failed to migrate repository", { error });
      return ctx.json({ error: message }, HTTP_BAD_REQUEST);
    }
  },
);
