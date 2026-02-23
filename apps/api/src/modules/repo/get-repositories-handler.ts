import { honoFactory } from "@/shared/utils/factory";
import { customZValidator } from "@/shared/utils/zod-validator";
import { authMiddleware } from "@/shared/middleware/auth.middleware";
import { HTTP_UNAUTHORIZED } from "@/shared/constants/http-status";
import { RepoService } from "./repo.service";
import { paginationSchema } from "./repo.schemas";

const repoService = new RepoService();

export const getRepositoriesHandler = honoFactory.createHandlers(
  customZValidator("query", paginationSchema),
  authMiddleware,
  async (ctx) => {
    const user = ctx.get("user");
    if (!user) {
      return ctx.json({ error: "Unauthorized" }, HTTP_UNAUTHORIZED);
    }

    const { page, limit, search } = ctx.req.valid("query");
    const repositories = await repoService.getRepositories(
      user.id,
      page,
      limit,
      search,
    );

    return ctx.json(repositories);
  },
);
