import { db } from "@envval/db";
import { environment } from "@envval/db/schema";
import { eq, and, count } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { CreateEnvBody, UpdateEnvBody } from "./env.schemas";
import { computeEnvId } from "@/shared/utils/id";

export type EnvironmentRow = InferSelectModel<typeof environment>;

export type UpdateEnvResult =
  | { success: true; env: EnvironmentRow }
  | {
      success: false;
      conflict: true;
      current: {
        latestHash: string;
        updatedAt: Date;
        lastUpdatedByDeviceId: string | null;
      };
    }
  | undefined;

function buildUpdatePayload(
  data: UpdateEnvBody,
): Partial<InferSelectModel<typeof environment>> & { updatedAt: Date } {
  const payload: Partial<InferSelectModel<typeof environment>> & {
    updatedAt: Date;
  } = {
    updatedAt: new Date(),
  };
  if (data.content !== undefined) {
    payload.content = data.content;
  }
  if (data.latestHash !== undefined) {
    payload.latestHash = data.latestHash;
  }
  if (data.envCount !== undefined) {
    payload.envCount = data.envCount;
  }
  if (data.fileName !== undefined) {
    payload.fileName = data.fileName;
  }
  return payload;
}

export class EnvService {
  async getAllEnvironments(
    userId: string,
    repoId?: string,
    includeContent = false,
  ) {
    const conditions = [eq(environment.userId, userId)];
    if (repoId) {
      conditions.push(eq(environment.repoId, repoId));
    }

    if (includeContent) {
      const result = await db
        .select()
        .from(environment)
        .where(and(...conditions));
      return result;
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
    const id = computeEnvId(data.repoId, data.fileName);
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

  async getEnvironmentCountByRepo(userId: string, repoId: string) {
    const [row] = await db
      .select({ count: count() })
      .from(environment)
      .where(
        and(eq(environment.userId, userId), eq(environment.repoId, repoId)),
      );
    return row?.count ?? 0;
  }

  async getEnvironmentByFileName(
    userId: string,
    repoId: string,
    fileName: string,
  ) {
    const [result] = await db
      .select()
      .from(environment)
      .where(
        and(
          eq(environment.userId, userId),
          eq(environment.repoId, repoId),
          eq(environment.fileName, fileName),
        ),
      );
    return result;
  }

  async updateEnvironment(
    userId: string,
    envId: string,
    data: UpdateEnvBody,
  ): Promise<UpdateEnvResult> {
    const [current] = await db
      .select({
        latestHash: environment.latestHash,
        updatedAt: environment.updatedAt,
        lastUpdatedByDeviceId: environment.lastUpdatedByDeviceId,
      })
      .from(environment)
      .where(and(eq(environment.userId, userId), eq(environment.id, envId)));

    if (!current) {
      return undefined;
    }

    if (current.latestHash !== data.baseHash) {
      return {
        success: false,
        conflict: true,
        current: {
          latestHash: current.latestHash,
          updatedAt: current.updatedAt,
          lastUpdatedByDeviceId: current.lastUpdatedByDeviceId ?? null,
        },
      };
    }

    const [updated] = await db
      .update(environment)
      .set(buildUpdatePayload(data))
      .where(and(eq(environment.userId, userId), eq(environment.id, envId)))
      .returning();

    return updated ? { success: true, env: updated } : undefined;
  }

  async deleteEnvironment(userId: string, envId: string) {
    const [result] = await db
      .delete(environment)
      .where(and(eq(environment.userId, userId), eq(environment.id, envId)))
      .returning();
    return result;
  }
}
