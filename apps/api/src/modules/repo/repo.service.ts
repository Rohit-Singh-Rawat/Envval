import { count, eq, max } from 'drizzle-orm';
import { db } from '@envval/db';
import { environment, repo } from '@envval/db/schema';

export class RepoService {
	async getRepositories(userId: string, page: number, limit: number) {
		const repositories = await db
			.select({
				id: repo.id,
				name: repo.name,
				gitRemoteUrl: repo.gitRemoteUrl,
				workspacePath: repo.workspacePath,
				environments: count(environment.id),
				lastSyncedAt: max(environment.updatedAt),
				createdAt: repo.createdAt,
				updatedAt: repo.updatedAt,
			})
			.from(repo)
			.where(eq(repo.userId, userId))
			.leftJoin(environment, eq(repo.id, environment.repoId))
			.offset((page - 1) * limit)
			.limit(limit)
			.groupBy(repo.id);
		return repositories;
	}
}
