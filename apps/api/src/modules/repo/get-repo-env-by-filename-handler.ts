import { z } from "zod";
import { honoFactory } from "@/shared/utils/factory";
import { customZValidator } from "@/shared/utils/zod-validator";
import { authMiddleware } from "@/shared/middleware/auth.middleware";
import {
  HTTP_UNAUTHORIZED,
  HTTP_NOT_FOUND,
} from "@/shared/constants/http-status";
import { EnvService } from "@/modules/envs/env.service";

const envService = new EnvService();

const repoEnvFileParamSchema = z.object({
  repoId: z.string().min(1, "Repository ID is required"),
  fileName: z.string().min(1, "File name is required"),
});

export const getRepoEnvByFilenameHandler = honoFactory.createHandlers(
  customZValidator("param", repoEnvFileParamSchema),
  authMiddleware,
  async (ctx) => {
    const user = ctx.get("user");
    if (!user) {
      return ctx.json({ error: "Unauthorized" }, HTTP_UNAUTHORIZED);
    }

    const { repoId, fileName } = ctx.req.valid("param");
    const result = await envService.getEnvironmentByFileName(
      user.id,
      repoId,
      fileName,
    );

    if (!result) {
      return ctx.json({ error: "Environment not found" }, HTTP_NOT_FOUND);
    }

    return ctx.json(result);
  },
);
