import { honoFactory } from "@/shared/utils/factory";
import { customZValidator } from "@/shared/utils/zod-validator";
import { authMiddleware } from "@/shared/middleware/auth.middleware";
import {
  HTTP_NOT_FOUND,
  HTTP_UNAUTHORIZED,
} from "@/shared/constants/http-status";
import { RepoService } from "./repo.service";
import { repoSlugParamSchema } from "./repo.schemas";

const repoService = new RepoService();

export const deleteRepositoryHandler = honoFactory.createHandlers(
  customZValidator("param", repoSlugParamSchema),
  authMiddleware,
  async (ctx) => {
    const user = ctx.get("user");
    if (!user) {
      return ctx.json({ error: "Unauthorized" }, HTTP_UNAUTHORIZED);
    }

    const { slug } = ctx.req.valid("param");

    const repository = await repoService.getRepositoryBySlug(user.id, slug);
    if (!repository) {
      return ctx.json({ error: "Repository not found" }, HTTP_NOT_FOUND);
    }

    const deleted = await repoService.deleteRepository(user.id, repository.id);
    if (!deleted) {
      return ctx.json({ error: "Failed to delete repository" }, HTTP_NOT_FOUND);
    }

    return ctx.json({ success: true, deleted });
  },
);
