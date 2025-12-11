
import { enqueueEmail } from '../lib/enqueue-email';
import { rateLimit } from '../lib/redis/rate-limit';
import { env } from '../env';

interface SendOTPEmailParams {
	email: string;
	otp: string;
}

export const sendOTPEmail = async ({ email, otp }: SendOTPEmailParams) => {
	await rateLimit({ actionType: 'email', identifier: email });

	const basePayload = {
		to: email,
		from: env.EMAIL_FROM,
		template: 'otp' as const,
		data: {
			otp,
			productName: 'EnvVal',
		},
	};

	await enqueueEmail({ ...basePayload });

	return { success: true };
};
