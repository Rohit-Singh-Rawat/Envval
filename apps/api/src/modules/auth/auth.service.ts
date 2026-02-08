import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { bearer, customSession, deviceAuthorization, emailOTP } from 'better-auth/plugins';
import { nanoid } from 'nanoid';
import { db } from '@envval/db';
import * as schema from '@envval/db/schema';
import { eq } from 'drizzle-orm';
import { AuthEmailService } from './auth-email.service';
import { DeviceService } from './device.service';
import { env } from '@/config/env';
import { encryptKeyMaterialWithMaster, generateKeyMaterial } from '@/shared/utils/crypto';

const emailService = new AuthEmailService();
const deviceService = new DeviceService();

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

	// adds additional fields to the user model and can be used in the user object

	user: {
		modelName: 'user',
		additionalFields: {
			keyMaterialEnc: {
				type: 'string',
			},
			keyMaterialIv: {
				type: 'string',
			},
			keyMaterialKeyId: {
				type: 'string',
			},
			onboarded: {
				type: 'boolean',
			},
			notificationPreferences: {
				type: 'string', // Stored as JSON string or object, better-auth might serialize it
				required: false,
			},
		},
	},

	// adds additional fields to the session model and can be used in the session object

	session: {
		modelName: 'session',
		additionalFields: {
			sessionType: {
				type: schema.sessionType.enumValues,
			},
			deviceId: {
				type: 'string',
			},
			publicKey: {
				type: 'string',
			},
			keyMaterialDelivered: {
				type: 'boolean',
			},
			keyMaterialDeliveredAt: {
				type: 'date',
			},
		},
	},

	/*
		hooks for the database operations that runs before and after the operation in the database
		before: runs before the operation in the database
		after: runs after the operation in the database

		use when we want to modify the data before it is inserted into the database or anywhere the better-auth does the operation in the database
	*/

	databaseHooks: {
		session: {
			create: {
				after: async (session) => {
					try {
						// Check if this is a new device login and user wants notifications
						const [user] = await db
							.select()
							.from(schema.user)
							.where(eq(schema.user.id, session.userId))
							.limit(1);

						if (!user) return;

						// Parse preferences safely
						let preferences = user.notificationPreferences as any;
						if (typeof preferences === 'string') {
							try {
								preferences = JSON.parse(preferences);
							} catch {
								preferences = { newRepoAdded: true, newDeviceLogin: true };
							}
						}

						if (preferences?.newDeviceLogin) {
							// Check if device info is available
							const deviceName = session.userAgent || 'Unknown Device';
							const location = session.ipAddress ? `IP: ${session.ipAddress}` : undefined;
							
							// Send email asynchronously
							emailService.sendNewDeviceLoginEmail(
								user.email,
								user.displayName || user.name,
								deviceName,
								new Date().toLocaleString(),
								location
							).catch(console.error);
						}
					} catch (error) {
						console.error('Error in session create hook:', error);
					}
				},
				before: async (data) => {
					console.log('session create before', data);
					const isExtension = isExtensionOrCli(data.userAgent);

					if (isExtension) {
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

		/* 
		hooks for adding additional fields to the user model and can be used in the user object	
		use when we want to modify the data before it is inserted into the database or anywhere the better-auth does the operation in the database

		here we are generating the key material and encrypting it with the master key and storing it in the database for each new user.
	*/

		user: {
			create: {
				before: async (user, context) => {
					const keyMaterial = generateKeyMaterial();
					const { ciphertext, iv, keyId } = encryptKeyMaterialWithMaster(keyMaterial);
					return {
						data: {
							...user,
							keyMaterialEnc: ciphertext,
							keyMaterialIv: iv,
							keyMaterialKeyId: keyId,
						},
					};
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
			return {
				user: sanitizeUser(user),
				session: sanitizeSession(session),
			};
		}),
		bearer(),
	],
});

function sanitizeUser<T extends Record<string, unknown>>(
	user: T
): Omit<T, 'keyMaterialEnc' | 'keyMaterialIv' | 'keyMaterialKeyId'> {
	const { keyMaterialEnc, keyMaterialIv, keyMaterialKeyId, ...rest } = user as T & {
		keyMaterialEnc?: unknown;
		keyMaterialIv?: unknown;
		keyMaterialKeyId?: unknown;
	};
	return rest as Omit<T, 'keyMaterialEnc' | 'keyMaterialIv' | 'keyMaterialKeyId'>;
}

function sanitizeSession<T extends Record<string, unknown>>(
	session: T
): Omit<T, 'publicKey' | 'keyMaterialDeliveredAt'> {
	const { publicKey, keyMaterialDeliveredAt, ...rest } = session as T & {
		publicKey?: unknown;
		keyMaterialDeliveredAt?: unknown;
	};
	return rest as Omit<T, 'publicKey' | 'keyMaterialDeliveredAt'>;
}

/**
 * Check if user agent is from extension or CLI
 */
function isExtensionOrCli(userAgent: string | null | undefined): boolean {
	if (!userAgent) return false;
	const ua = userAgent.toLowerCase();
	return ua.includes('envval-extension') || ua.includes('envval-cli');
}
