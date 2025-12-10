import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { emailOTP, jwt } from 'better-auth/plugins';
import { db } from '@envval/db';
import * as schema from '@envval/db/schema';
import { sendOTPEmail } from '../lib/resend/send-email';
import { ensureDeviceExists } from '../utils/ensure-device-exist';

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg', // or "mysql", "sqlite"
		schema: {
			...schema,
		},
	}),
	trustedOrigins: ['http://localhost:3000', 'http://localhost:3001'],
	socialProviders: {
		google: {
			prompt: 'select_account',
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		},
		github: {
			clientId: process.env.GITHUB_CLIENT_ID!,
			clientSecret: process.env.GITHUB_CLIENT_SECRET!,
		},
	},
	session: {
		modelName: 'envval_session',
		additionalFields: {
			sessionType: {
				type: schema.sessionType.enumValues,
			},
			deviceId: {
				type: 'string',
			},
		},
	},

	databaseHooks: {
		session: {
			create: {
				before: async (data, ctx) => {
					const deviceId = data.userId + '-' + 'web';
					const device = await ensureDeviceExists(deviceId, data.userId, 'DEVICE_WEB', {
						name: 'Web Device',
						lastIpAddress: data.ipAddress,
						lastUserAgent: data.userAgent,
					});
					if (!device) {
						throw new Error('Device not found');
					}
					return {
						data: {
							...data,
							deviceId: data.userId + '-' + 'web',
							sessionType: 'SESSION_WEB',
						},
					};
				},
			},
		},
	},
	plugins: [
		jwt({
			jwt: {
				definePayload: (session) => ({
					sessionId: session.session.token,
					userId: session.user.id,
					deviceId: session.session.deviceId,
					sessionType: session.session.sessionType,
				}),
			},
		}),
		emailOTP({
			sendVerificationOTP: async ({ email, otp, type }) => {
				if (type !== 'sign-in') return;
				await sendOTPEmail({ email, otp });
			},
			expiresIn: 600,
			allowedAttempts: 5,
			sendVerificationOnSignUp: false,
			overrideDefaultEmailVerification: false,
		}),
	],
});
