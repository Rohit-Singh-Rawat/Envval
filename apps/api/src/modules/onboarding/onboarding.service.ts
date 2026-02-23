import { db } from "@envval/db";
import { user, userAttribution } from "@envval/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/modules/auth/auth.service";
import { AuthEmailService } from "@/modules/auth/auth-email.service";
import { logger } from "@/shared/utils/logger";

type UserAttributionData = {
  source?: string | null;
  medium?: string | null;
  details?: string | null;
  referrerUrl?: string | null;
  landingPageUrl?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

const emailService = new AuthEmailService();

export class OnboardingService {
  async addUserAttribute(userId: string, data: UserAttributionData) {
    const attribution = {
      id: crypto.randomUUID(),
      userId,
      source: data.source ?? null,
      medium: data.medium ?? null,
      details: data.details ?? null,
      referrerUrl: data.referrerUrl ?? null,
      landingPageUrl: data.landingPageUrl ?? null,
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
    };

    await db.insert(userAttribution).values(attribution);
    return attribution;
  }

  async completeOnboarding(userId: string, headers: HeadersInit) {
    // Update onboarded flag directly in DB since better-auth doesn't have this field
    await db.update(user).set({ onboarded: true }).where(eq(user.id, userId));

    // Fetch updated user
    const session = await auth.api.getSession({ headers });
    return session?.user ?? null;
  }

  async sendWelcomeEmail(userId: string, name: string) {
    // Get user email from database
    const [userData] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userData?.email) {
      throw new Error("User email not found");
    }
    logger.debug("Sending welcome email", { email: userData.email, name });
    await emailService.sendWelcomeEmail(userData.email, name);
    return { success: true };
  }
}
