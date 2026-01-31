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
	async getRepositoryExists(userId: string, repoId: string) {
		const [repository] = await db
			.select()
			.from(repo)
			.where(and(eq(repo.id, repoId), eq(repo.userId, userId)));
		return repository || null;
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

	async createRepository(
		userId: string,
		repoData: { id: string; gitRemoteUrl?: string; workspacePath: string }
	) {
		const [repository] = await db
			.insert(repo)
			.values({
				id: repoData.id,
				gitRemoteUrl: repoData.gitRemoteUrl ?? null,
				workspacePath: repoData.workspacePath,
				userId,
			})
			.returning({ id: repo.id });
		return repository;
	}

	async migrateRepository(userId: string, oldRepoId: string, newRepoId: string) {
		return await db.transaction(async (tx) => {
			// 1. Check if old repo exists and belongs to user
			const [existingRepo] = await tx
				.select()
				.from(repo)
				.where(and(eq(repo.id, oldRepoId), eq(repo.userId, userId)));

			if (!existingRepo) {
				throw new Error('Original repository not found or unauthorized');
			}

			// 2. Check if new repo already exists
			const [conflictRepo] = await tx.select().from(repo).where(eq(repo.id, newRepoId));
			if (conflictRepo) {
				throw new Error('Target repository ID already exists');
			}

			// 3. Create new repo record based on old one
			await tx.insert(repo).values({
				...existingRepo,
				id: newRepoId,
				updatedAt: new Date(),
			});

			// 4. Update all environments to point to new repo ID
			await tx
				.update(environment)
				.set({ repoId: newRepoId })
				.where(and(eq(environment.repoId, oldRepoId), eq(environment.userId, userId)));

			// 5. Delete old repo record
			await tx.delete(repo).where(and(eq(repo.id, oldRepoId), eq(repo.userId, userId)));

			return { success: true };
		});
	}
}
