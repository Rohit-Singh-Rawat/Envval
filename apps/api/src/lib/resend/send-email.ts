import { env } from '@/env';
import resend from '.';
import { rateLimit } from '../redis/rate-limit';
import { OtpEmail } from './templates/otp-email';

interface SendOTPEmailParams {
	email: string;
	otp: string;
}

export async function sendOTPEmail({ email, otp }: SendOTPEmailParams) {
	const subject = 'Your Envval sign-in code';

	try {
		await rateLimit({ actionType: 'emailToken', identifier: email });

		const { data, error } = await resend.emails.send({
			from: env.RESEND_FROM_EMAIL,
			to: [email],
			subject,
			react: OtpEmail({
				otp,
				type: 'sign-in',
				productName: 'Envval',
			}),
		});

		if (error) {
			console.error('Failed to send OTP email:', error);
			throw new Error('Failed to send OTP email');
		}

		return data;
	} catch (error) {
		console.error('Error sending OTP email:', error);
		throw error;
	}
}
