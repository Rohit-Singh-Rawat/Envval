import { enqueueEmail } from '@/shared/lib/email/enqueue';
import { enforceRateLimit } from '@/shared/lib/redis/rate-limit';
import { env } from '@/config/env';
import { branding } from '@/config/branding';

export class AuthEmailService {
	async sendOTP(email: string, otp: string) {
		await enforceRateLimit('email', email);

		await enqueueEmail({
			to: email,
			from: env.EMAIL_FROM,
			template: 'otp' as const,
			data: {
				otp,
				productName: branding.productName,
				supportEmail: branding.supportEmail,
				logoUrl: branding.logoUrl || undefined,
			},
		});

		return { success: true };
	}

	async sendWelcomeEmail(email: string, name: string) {
		await enforceRateLimit('email', email);

		await enqueueEmail({
			to: email,
			from: env.EMAIL_FROM,
			template: 'welcome' as const,
			data: {
				name,
				productName: branding.productName,
				supportEmail: branding.supportEmail,
				logoUrl: branding.logoUrl || undefined,
				welcomeImageUrl: branding.welcomeImageUrl || undefined,
				dashboardUrl: `${env.APP_URL}/dashboard`,
			},
		});

		return { success: true };
	}

	async sendNewRepoEmail(email: string, userName: string, repoName: string, repoUrl?: string) {
		await enforceRateLimit('email', email);

		await enqueueEmail({
			to: email,
			from: env.EMAIL_FROM,
			template: 'new-repo' as const,
			data: {
				userName,
				repoName,
				repoUrl,
				productName: branding.productName,
				supportEmail: branding.supportEmail,
				logoUrl: branding.logoUrl || undefined,
			},
		});

		return { success: true };
	}

	async sendNewDeviceLoginEmail(
		email: string,
		data: {
			userName: string;
			deviceName: string;
			timestamp: string;
			signInType?: string;
			location?: string;
			ipAddress?: string;
			revokeUrl?: string;
		}
	) {
		await enforceRateLimit('email', email);

		await enqueueEmail({
			to: email,
			from: env.EMAIL_FROM,
			template: 'new-device' as const,
			data: {
				...data,
				productName: branding.productName,
				supportEmail: branding.supportEmail,
				logoUrl: branding.logoUrl || undefined,
			},
		});

		return { success: true };
	}
}
