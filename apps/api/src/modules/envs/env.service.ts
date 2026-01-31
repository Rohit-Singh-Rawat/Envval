import { db } from '@envval/db';
import { environment } from '@envval/db/schema';
import { eq, and } from 'drizzle-orm';
import { CreateEnvBody, UpdateEnvBody } from './env.schemas';
import { nanoid } from 'nanoid';

export class EnvService {
	async getAllEnvironments(userId: string, repoId?: string) {
		const conditions = [eq(environment.userId, userId)];
		if (repoId) {
			conditions.push(eq(environment.repoId, repoId));
		}

		const result = await db
			.select({
				id: environment.id,
				repoId: environment.repoId,
				fileName: environment.fileName,
				envCount: environment.envCount,
				latestHash: environment.latestHash,
				lastUpdatedByDeviceId: environment.lastUpdatedByDeviceId,
				createdAt: environment.createdAt,
				updatedAt: environment.updatedAt,
			})
			.from(environment)
			.where(and(...conditions));
		return result;
	}

	async createEnvironment(userId: string, data: CreateEnvBody) {
		const id = nanoid();
		const [result] = await db
			.insert(environment)
			.values({
				id,
				userId,
				repoId: data.repoId,
				fileName: data.fileName,
				content: data.content,
				envCount: data.envCount,
				latestHash: data.latestHash,
			})
			.returning();
		return result;
	}

	async getEnvironmentById(userId: string, envId: string) {
		const [result] = await db
			.select()
			.from(environment)
			.where(and(eq(environment.userId, userId), eq(environment.id, envId)));
		return result;
	}

	async getEnvironmentMetadataById(userId: string, envId: string) {
		const [result] = await db
			.select({
				id: environment.id,
				repoId: environment.repoId,
				fileName: environment.fileName,
				envCount: environment.envCount,
				latestHash: environment.latestHash,
				lastUpdatedByDeviceId: environment.lastUpdatedByDeviceId,
				createdAt: environment.createdAt,
				updatedAt: environment.updatedAt,
			})
			.from(environment)
			.where(and(eq(environment.userId, userId), eq(environment.id, envId)));
		return result;
	}

	async getEnvironmentByFileName(userId: string, repoId: string, fileName: string) {
		const [result] = await db
			.select()
			.from(environment)
			.where(
				and(
					eq(environment.userId, userId),
					eq(environment.repoId, repoId),
					eq(environment.fileName, fileName)
				)
			);
		return result;
	}

	async updateEnvironment(userId: string, envId: string, data: UpdateEnvBody) {
		const [result] = await db
			.update(environment)
			.set({
				...data,
				updatedAt: new Date(),
			})
			.where(and(eq(environment.userId, userId), eq(environment.id, envId)))
			.returning();
		return result;
	}

	async deleteEnvironment(userId: string, envId: string) {
		const [result] = await db
			.delete(environment)
			.where(and(eq(environment.userId, userId), eq(environment.id, envId)))
			.returning();
		return result;
	}
}
