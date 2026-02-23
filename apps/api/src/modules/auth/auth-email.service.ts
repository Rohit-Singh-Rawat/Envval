import { enqueueEmail } from "@/shared/lib/email/enqueue";
import { enforceRateLimit } from "@/shared/lib/redis/rate-limit";
import { env } from "@/config/env";
import { branding } from "@/config/branding";

/** Shared branding fields injected into every email payload. */
const brandingData = {
  productName: branding.productName,
  supportEmail: branding.supportEmail,
  logoUrl: branding.logoUrl,
} as const;

interface NewDeviceLoginData {
  userName: string;
  deviceName: string;
  timestamp: string;
  signInType?: string;
  location?: string;
  ipAddress?: string;
  revokeUrl?: string;
}

export class AuthEmailService {
  async sendOTP(email: string, otp: string) {
    await enqueueEmail({
      to: email,
      from: env.EMAIL_FROM,
      template: "otp",
      data: { otp, ...brandingData },
    });

    return { success: true };
  }

  async sendWelcomeEmail(email: string, name: string) {
    await enforceRateLimit("email", email);

    await enqueueEmail({
      to: email,
      from: env.EMAIL_FROM,
      template: "welcome",
      data: {
        name,
        ...brandingData,
        welcomeImageUrl: branding.welcomeImageUrl,
        dashboardUrl: `${env.APP_URL}/dashboard`,
      },
    });

    return { success: true };
  }

  async sendNewRepoEmail(
    email: string,
    userName: string,
    repoName: string,
    repoUrl?: string,
  ) {
    await enforceRateLimit("email", email);

    await enqueueEmail({
      to: email,
      from: env.EMAIL_FROM,
      template: "new-repo",
      data: { userName, repoName, repoUrl, ...brandingData },
    });

    return { success: true };
  }

  async sendNewDeviceLoginEmail(email: string, data: NewDeviceLoginData) {
    await enforceRateLimit("email", email);

    await enqueueEmail({
      to: email,
      from: env.EMAIL_FROM,
      template: "new-device",
      data: { ...data, ...brandingData },
    });

    return { success: true };
  }
}
