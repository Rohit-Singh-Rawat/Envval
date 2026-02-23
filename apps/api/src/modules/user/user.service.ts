import { db } from "@envval/db";
import { user, repo, environment } from "@envval/db/schema";
import { eq, count, desc } from "drizzle-orm";

export type NotificationPreferences = {
  newRepoAdded: boolean;
  newDeviceLogin: boolean;
};

export type UpdateProfileData = {
  displayName?: string;
  avatar?: string;
};

export class UserService {
  /**
   * Retrieves complete user profile information.
   */
  static async getUserProfile(userId: string) {
    const [userData] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        notificationPreferences: user.notificationPreferences,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userData) {
      return null;
    }

    // Parse notification preferences from JSON string
    const preferences =
      typeof userData.notificationPreferences === "string"
        ? JSON.parse(userData.notificationPreferences)
        : userData.notificationPreferences;

    return {
      ...userData,
      notificationPreferences: preferences as NotificationPreferences,
    };
  }

  /**
   * Updates user profile fields (displayName, avatar).
   */
  static async updateProfile(userId: string, data: UpdateProfileData) {
    const [updated] = await db
      .update(user)
      .set({
        ...(data.displayName !== undefined && {
          displayName: data.displayName,
        }),
        ...(data.avatar !== undefined && { avatar: data.avatar as any }),
      })
      .where(eq(user.id, userId))
      .returning();

    return updated;
  }

  /**
   * Updates user notification preferences.
   */
  static async updateNotificationPreferences(
    userId: string,
    preferences: NotificationPreferences,
  ) {
    const [updated] = await db
      .update(user)
      .set({
        notificationPreferences: JSON.stringify(preferences) as any,
      })
      .where(eq(user.id, userId))
      .returning();

    return updated;
  }

  /**
   * Retrieves user statistics (repo count, env count, last activity).
   */
  static async getUserStats(userId: string) {
    // Get total repositories
    const [repoCount] = await db
      .select({ count: count() })
      .from(repo)
      .where(eq(repo.userId, userId));

    // Get total environments
    const [envCount] = await db
      .select({ count: count() })
      .from(environment)
      .where(eq(environment.userId, userId));

    // Get most recently updated environment for "last activity"
    const [lastActivity] = await db
      .select({ updatedAt: environment.updatedAt })
      .from(environment)
      .where(eq(environment.userId, userId))
      .orderBy(desc(environment.updatedAt))
      .limit(1);

    // Get account creation date
    const [userData] = await db
      .select({ createdAt: user.createdAt })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    return {
      totalRepositories: repoCount?.count || 0,
      totalEnvironments: envCount?.count || 0,
      lastSync: lastActivity?.updatedAt || null,
      accountCreated: userData?.createdAt || null,
    };
  }

  /**
   * Deletes all repositories and their environments for a user.
   * Critical action - cascading deletes will remove all associated data.
   */
  static async deleteAllRepositories(userId: string) {
    const deleted = await db
      .delete(repo)
      .where(eq(repo.userId, userId))
      .returning();
    return deleted;
  }

  /**
   * Deletes user account and all associated data.
   * Critical action - cascading deletes will remove sessions, devices, repos, environments.
   */
  static async deleteAccount(userId: string) {
    const [deleted] = await db
      .delete(user)
      .where(eq(user.id, userId))
      .returning();
    return deleted;
  }
}
