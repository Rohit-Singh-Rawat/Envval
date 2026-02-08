import { enqueueEmail } from '@/shared/lib/email/enqueue';
import { rateLimit } from '@/shared/lib/redis/rate-limit';
import { env } from '@/config/env';

export class AuthEmailService {
	async sendOTP(email: string, otp: string) {
		await rateLimit({ actionType: 'email', identifier: email });

		await enqueueEmail({
			to: email,
			from: env.EMAIL_FROM,
			template: 'otp' as const,
			data: {
				otp,
				productName: 'EnvVal',
			},
		});

		return { success: true };
	}

	async sendWelcomeEmail(email: string, name: string) {
		await rateLimit({ actionType: 'email', identifier: email });

		await enqueueEmail({
			to: email,
			from: env.EMAIL_FROM,
			template: 'welcome' as const,
			data: {
				name,
				productName: 'EnvVal',
			},
		});

		return { success: true };
	}
	async sendNewRepoEmail(email: string, userName: string, repoName: string, repoUrl?: string) {
		await rateLimit({ actionType: 'email', identifier: email });

		await enqueueEmail({
			to: email,
			from: env.EMAIL_FROM,
			template: 'new-repo' as const,
			data: {
				userName,
				repoName,
				repoUrl,
				productName: 'EnvVal',
			},
		});

		return { success: true };
	}

	async sendNewDeviceLoginEmail(
		email: string,
		userName: string,
		deviceName: string,
		timestamp: string,
		location?: string
	) {
		await rateLimit({ actionType: 'email', identifier: email });

		await enqueueEmail({
			to: email,
			from: env.EMAIL_FROM,
			template: 'new-device' as const,
			data: {
				userName,
				deviceName,
				timestamp,
				location,
				productName: 'EnvVal',
			},
		});

		return { success: true };
	}
}
