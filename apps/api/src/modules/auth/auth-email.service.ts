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
}
