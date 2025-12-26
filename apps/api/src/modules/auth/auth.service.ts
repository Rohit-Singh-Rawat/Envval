import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { customSession, deviceAuthorization, emailOTP } from 'better-auth/plugins';
import { eq } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '@envval/db';
import * as schema from '@envval/db/schema';
import { AuthEmailService } from './auth-email.service';
import { DeviceService } from './device.service';
import { env } from '@/config/env';

const emailService = new AuthEmailService();
const deviceService = new DeviceService();

/**
 * Check if user agent is from extension or CLI
 */
function isExtensionOrCli(userAgent: string | null | undefined): boolean {
	if (!userAgent) return false;
	const ua = userAgent.toLowerCase();
	return ua.includes('envval-extension') || ua.includes('envval-cli');
}

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg',
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
		modelName: 'session',
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
				before: async (data) => {
					// Check if request is from extension or CLI
					const isExtension = isExtensionOrCli(data.userAgent);

					if (isExtension) {
						// Extension/CLI: generate random device ID
						const deviceId = `ext-${nanoid(12)}`;
						const device = await deviceService.ensureExists(
							deviceId,
							data.userId,
							'DEVICE_EXTENSION',
							{
								name: `Extension - ${new Date().toLocaleDateString()}`,
								lastIpAddress: data.ipAddress,
								lastUserAgent: data.userAgent,
							}
						);
						if (!device) {
							throw new Error('Failed to create device');
						}
						return {
							data: {
								...data,
								deviceId,
								sessionType: 'SESSION_EXTENSION',
							},
						};
					} else {
						// Web: use userId-web as device ID
						const deviceId = `${data.userId}-web`;
						const device = await deviceService.ensureExists(deviceId, data.userId, 'DEVICE_WEB', {
							name: 'Web Device',
							lastIpAddress: data.ipAddress,
							lastUserAgent: data.userAgent,
						});
						if (!device) {
							throw new Error('Failed to create device');
						}
						return {
							data: {
								...data,
								deviceId,
								sessionType: 'SESSION_WEB',
							},
						};
					}
				},
			},
		},
	},
	plugins: [
		deviceAuthorization({
			verificationUri: env.APP_URL + '/device',
			expiresIn: '10m',
			interval: '5s',
			userCodeLength: 8,

			// Validate client (only allow known clients)
			validateClient: async (clientId) => {
				const allowedClients = ['envval-extension', 'envval-cli'];
				return allowedClients.includes(clientId);
			},

			// Hook when device is approved
			onDeviceAuthRequest: async (clientId, scope) => {
				console.log(`Device auth requested: ${clientId}, scope: ${scope}`);
			},
		}),
		emailOTP({
			sendVerificationOTP: async ({ email, otp, type }) => {
				if (type !== 'sign-in') return;
				await emailService.sendOTP(email, otp);
			},
			expiresIn: 600,
			allowedAttempts: 5,
			sendVerificationOnSignUp: false,
			overrideDefaultEmailVerification: false,
		}),
		customSession(async ({ user, session }) => {
			const [result] = await db
				.select({ onboarded: schema.user.onboarded })
				.from(schema.user)
				.where(eq(schema.user.id, user.id))
				.limit(1);
			return {
				user: {
					...user,
					onboarded: result?.onboarded ?? false,
				},
				session,
			};
		}),
	],
});
