import { and, count, eq, max, sum } from 'drizzle-orm';
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
				totalEnvCount: sum(environment.envCount),
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

	async getRepositorySummary(userId: string, repoId: string) {
		const results = await db
			.select({
				id: repo.id,
				name: repo.name,
				gitRemoteUrl: repo.gitRemoteUrl,
				workspacePath: repo.workspacePath,
				createdAt: repo.createdAt,
				updatedAt: repo.updatedAt,
				envCount: sum(environment.envCount),
				lastSyncedAt: max(environment.updatedAt),
			})
			.from(repo)
			.where(and(eq(repo.id, repoId), eq(repo.userId, userId)))
			.leftJoin(environment, eq(repo.id, environment.repoId))
			.groupBy(repo.id);

		if (results.length === 0) {
			return null;
		}

		return results[0];
	}

	async getEnvironments(userId: string, repoId: string) {
		const environments = await db
			.select({
				id: environment.id,
				fileName: environment.fileName,
				envCount: environment.envCount,
				lastUpdatedByDeviceId: environment.lastUpdatedByDeviceId,
				createdAt: environment.createdAt,
				updatedAt: environment.updatedAt,
			})
			.from(environment)
			.where(and(eq(environment.repoId, repoId), eq(environment.userId, userId)));
		return environments;
	}
}
