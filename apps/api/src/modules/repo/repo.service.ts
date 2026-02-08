import { and, count, eq, like, max, or, sum } from 'drizzle-orm';
import { db } from '@envval/db';
import { auditLog, environment, repo } from '@envval/db/schema';
import { computeEnvId } from '@/shared/utils/id';

/**
 * Generates a URL-safe slug from a name string.
 * Handles unicode characters and ensures valid slug format.
 */
function generateSlug(name: string): string {
	return name
		.toLowerCase()
		.trim()
		.replace(/[^\w\s-]/g, '')
		.replace(/[\s_-]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export class RepoService {
	async getRepositories(userId: string, page: number, limit: number, search?: string) {
		const whereClause = and(
			eq(repo.userId, userId),
			search ? or(like(repo.name, `%${search}%`), like(repo.slug, `%${search}%`)) : undefined
		);

		const repositories = await db
			.select({
				id: repo.id,
				name: repo.name,
				slug: repo.slug,
				gitRemoteUrl: repo.gitRemoteUrl,
				workspacePath: repo.workspacePath,
				totalEnvCount: sum(environment.envCount),
				environments: count(environment.id),
				lastSyncedAt: max(environment.updatedAt),
				createdAt: repo.createdAt,
				updatedAt: repo.updatedAt,
			})
			.from(repo)
			.where(whereClause)
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

	async getRepositoryBySlug(userId: string, slug: string) {
		const [repository] = await db
			.select()
			.from(repo)
			.where(and(eq(repo.slug, slug), eq(repo.userId, userId)));
		return repository || null;
	}

	async getRepositorySummary(userId: string, repoId: string) {
		const results = await db
			.select({
				id: repo.id,
				name: repo.name,
				slug: repo.slug,
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

	async getRepositorySummaryBySlug(userId: string, slug: string) {
		const results = await db
			.select({
				id: repo.id,
				name: repo.name,
				slug: repo.slug,
				gitRemoteUrl: repo.gitRemoteUrl,
				workspacePath: repo.workspacePath,
				createdAt: repo.createdAt,
				updatedAt: repo.updatedAt,
				envCount: sum(environment.envCount),
				lastSyncedAt: max(environment.updatedAt),
			})
			.from(repo)
			.where(and(eq(repo.slug, slug), eq(repo.userId, userId)))
			.leftJoin(environment, eq(repo.id, environment.repoId))
			.groupBy(repo.id);

		if (results.length === 0) {
			return null;
		}

		return results[0];
	}

	async getEnvironments(userId: string, repoId: string, includeContent = false) {
		const selection: any = {
			id: environment.id,
			fileName: environment.fileName,
			envCount: environment.envCount,
			lastUpdatedByDeviceId: environment.lastUpdatedByDeviceId,
			createdAt: environment.createdAt,
			updatedAt: environment.updatedAt,
		};

		if (includeContent) {
			selection.content = environment.content;
		}

		const environments = await db
			.select(selection)
			.from(environment)
			.where(and(eq(environment.repoId, repoId), eq(environment.userId, userId)));
		return environments;
	}

	/**
	 * Generates a unique slug for a repository within a user's scope.
	 * If the base slug already exists, appends an incrementing number.
	 */
	private async generateUniqueSlug(userId: string, baseName: string): Promise<string> {
		const baseSlug = generateSlug(baseName);
		if (!baseSlug) {
			return `repo-${Date.now()}`;
		}

		const existingRepos = await db
			.select({ slug: repo.slug })
			.from(repo)
			.where(and(eq(repo.userId, userId), like(repo.slug, `${baseSlug}%`)));

		if (existingRepos.length === 0) {
			return baseSlug;
		}

		const existingSlugs = new Set(existingRepos.map((r) => r.slug));
		if (!existingSlugs.has(baseSlug)) {
			return baseSlug;
		}

		let counter = 1;
		let candidateSlug = `${baseSlug}-${counter}`;
		while (existingSlugs.has(candidateSlug)) {
			counter++;
			candidateSlug = `${baseSlug}-${counter}`;
		}

		return candidateSlug;
	}

	async createRepository(
		userId: string,
		repoData: { id: string; name: string; gitRemoteUrl?: string; workspacePath: string }
	) {
		const slug = await this.generateUniqueSlug(userId, repoData.name);

		const [repository] = await db
			.insert(repo)
			.values({
				id: repoData.id,
				name: repoData.name,
				slug,
				gitRemoteUrl: repoData.gitRemoteUrl ?? null,
				workspacePath: repoData.workspacePath,
				userId,
			})
			.returning({ id: repo.id, name: repo.name, slug: repo.slug });
		return repository;
	}

	async updateRepository(
		userId: string,
		repoId: string,
		updateData: { name?: string; slug?: string }
	) {
		const updates: Partial<{ name: string; slug: string }> = {};

		if (updateData.name) {
			updates.name = updateData.name;
		}

		if (updateData.slug) {
			const existingWithSlug = await this.getRepositoryBySlug(userId, updateData.slug);
			if (existingWithSlug && existingWithSlug.id !== repoId) {
				throw new Error('Slug already in use');
			}
			updates.slug = updateData.slug;
		}

		if (Object.keys(updates).length === 0) {
			return null;
		}

		const [updated] = await db
			.update(repo)
			.set(updates)
			.where(and(eq(repo.id, repoId), eq(repo.userId, userId)))
			.returning({ id: repo.id, name: repo.name, slug: repo.slug });

		return updated || null;
	}

	async deleteRepository(userId: string, repoId: string) {
		const [deleted] = await db
			.delete(repo)
			.where(and(eq(repo.id, repoId), eq(repo.userId, userId)))
			.returning({ id: repo.id, name: repo.name });

		return deleted || null;
	}

	async migrateRepository(
		userId: string,
		oldRepoId: string,
		newRepoId: string,
		gitRemoteUrl?: string
	) {
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
				gitRemoteUrl: gitRemoteUrl ?? existingRepo.gitRemoteUrl,
				updatedAt: new Date(),
			});

			// 4. Fetch all environments for the old repo
			const environments = await tx
				.select()
				.from(environment)
				.where(and(eq(environment.repoId, oldRepoId), eq(environment.userId, userId)));

			// 5. Migrate environments with new IDs based on new RepoID
			// OPTIMIZED: Prepare data in memory and perform bulk inserts in chunks.
			// Bulk inserts are significantly faster than sequential awaits.
			// Old records are automatically cleaned up via ON DELETE CASCADE when we delete the old repo.
			const newEnvRecords = environments.map((env) => ({
				...env,
				id: computeEnvId(newRepoId, env.fileName), // Deterministic new ID
				repoId: newRepoId,
				updatedAt: new Date(),
			}));

				if (newEnvRecords.length > 0) {
				// Chunking to avoid hitting Postgres parameter limits (max 65535 params)
				// Each row has ~10 columns, so 1000 rows = ~10,000 params, well within limits
				const CHUNK_SIZE = 1000;
				for (let i = 0; i < newEnvRecords.length; i += CHUNK_SIZE) {
					const chunk = newEnvRecords.slice(i, i + CHUNK_SIZE);
					await tx.insert(environment).values(chunk);
				}

				// 6. Migrate Audit Logs
				// We must map oldEnvId -> newEnvId and update the audit logs.
				// Since we can't easily do a bulk connection update based on a map in SQL without temp tables,
				// and audit logs primarily need to just NOT BE LOST, we can iterate.
				// Optimization: Group by envId to minimize queries (1 update per environment file, not per log entry).
				for (const newRec of newEnvRecords) {
					// We can derive old ID from the original 'environments' fetch or re-compute.
					// environments[x].id is the OLD ID. newRec.id is the NEW ID.
					// We need to match them. 'newEnvRecords' was mapped from 'environments', so order is preserved?
					// Safer to look up by fileName.
					const oldEnv = environments.find(e => e.fileName === newRec.fileName);
					if (oldEnv) {
						await tx
							.update(auditLog)
							.set({ environmentId: newRec.id })
							.where(eq(auditLog.environmentId, oldEnv.id));
					}
				}
			}

			// 6. Delete old repo record (Triggers CASCADE delete for old environments)
			await tx.delete(repo).where(and(eq(repo.id, oldRepoId), eq(repo.userId, userId)));

			return { success: true };
		});
	}
}
