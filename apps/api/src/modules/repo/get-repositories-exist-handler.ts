import { honoFactory } from "@/shared/utils/factory";
import { customZValidator } from "@/shared/utils/zod-validator";
import { authMiddleware } from "@/shared/middleware/auth.middleware";
import {
  HTTP_NOT_FOUND,
  HTTP_UNAUTHORIZED,
} from "@/shared/constants/http-status";
import { RepoService } from "./repo.service";
import { repoExistsQuerySchema } from "./repo.schemas";

const repoService = new RepoService();

export const getRepositoryExistsHandler = honoFactory.createHandlers(
  customZValidator("query", repoExistsQuerySchema),
  authMiddleware,
  async (ctx) => {
    const user = ctx.get("user");
    if (!user) {
      return ctx.json({ error: "Unauthorized" }, HTTP_UNAUTHORIZED);
    }

    const { repoId } = ctx.req.valid("query");
    const repo = await repoService.getRepositoryExists(user.id, repoId);

    return ctx.json({ exists: !!repo, repo });
  },
);
