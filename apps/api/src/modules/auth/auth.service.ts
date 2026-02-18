import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { bearer, customSession, deviceAuthorization, emailOTP } from 'better-auth/plugins';
import { nanoid } from 'nanoid';
import { db } from '@envval/db';
import * as schema from '@envval/db/schema';
import { eq, desc } from 'drizzle-orm';
import { AuthEmailService } from './auth-email.service';
import { DeviceService } from './device.service';
import { env } from '@/config/env';
import { encryptKeyMaterialWithMaster, generateKeyMaterial } from '@/shared/utils/crypto';
import { parseDeviceName, formatEmailTimestamp } from '@/shared/utils/user-agent';
import { rateLimitStorage } from '@/shared/lib/redis/rate-limit-storage';
import { logger } from '@/shared/utils/logger';

const emailService = new AuthEmailService();
const deviceService = new DeviceService();

type DbUser = typeof schema.user.$inferSelect;
type DbSession = typeof schema.session.$inferSelect;

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: {
			...schema,
		},
	}),
	trustedOrigins: [
		env.APP_URL,
		...(env.CORS_ORIGINS?.split(',')
			.map((o) => o.trim())
			.filter(Boolean) ?? []),
	],
	advanced: {
		// Share session cookie across subdomains (e.g. app.envval.com + api.envval.com)
		// Set COOKIE_DOMAIN=envval.com in prod. Leave unset for localhost.
		...(env.COOKIE_DOMAIN && {
			crossSubDomainCookies: {
				enabled: true,
				domain: env.COOKIE_DOMAIN,
			},
		}),
		...(env.NODE_ENV === 'production'
			? {
					cookies: {
						state: {
							attributes: {
								secure: true,
								sameSite: 'none',
							},
						},
					},
				}
			: {}),
		cookiePrefix: 'envval-auth',
	},
	rateLimit: {
		enabled: true,
		window: 60,
		max: 100,
		customRules: {
			'/email-otp/send-verification-otp': {
				window: 1800,
				max: 5,
			},
			'/sign-in/email-otp': {
				window: 60,
				max: 5,
			},
		},
	},
	socialProviders: {
		google: {
			prompt: 'select_account',
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,
		},
		github: {
			clientId: env.GITHUB_CLIENT_ID,
			clientSecret: env.GITHUB_CLIENT_SECRET,
		},
	},
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
			avatar: {
				type: 'string',
			},
			notificationPreferences: {
				type: 'string',
				required: false,
			},
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
	databaseHooks: {
		session: {
			create: {
				after: async (session) => {
					try {
						const [user] = await db
							.select()
							.from(schema.user)
							.where(eq(schema.user.id, session.userId))
							.limit(1);

						if (!user) return;

						const preferences = parseNotificationPreferences(user.notificationPreferences);
						if (!preferences.newDeviceLogin) return;

						// Fetch the user's most recently linked auth provider.
						// emailOTP sign-ins don't create account rows, so latestAccount
						// will be undefined for OTP users — handled by resolveSignInLabel.
						const [latestAccount] = await db
							.select({ providerId: schema.account.providerId })
							.from(schema.account)
							.where(eq(schema.account.userId, session.userId))
							.orderBy(desc(schema.account.createdAt))
							.limit(1);

						const sessionType = isSessionType(session.sessionType)
							? session.sessionType
							: 'SESSION_WEB';

						emailService
							.sendNewDeviceLoginEmail(user.email, {
								userName: user.displayName || user.name,
								deviceName: parseDeviceName(session.userAgent),
								signInType: resolveSignInLabel(latestAccount?.providerId, sessionType),
								timestamp: formatEmailTimestamp(new Date()),
								ipAddress: session.ipAddress ?? undefined,
								revokeUrl: `${env.APP_URL}/devices`,
							})
							.catch((err: unknown) => logger.error('Failed to send login notification email', { error: err instanceof Error ? err.message : String(err) }));
					} catch (error) {
						logger.error('Error in session create hook', { error: error instanceof Error ? error.message : String(error) });
					}
				},
				before: async (data) => {
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

		user: {
			create: {
				before: async (user) => {
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

			validateClient: async (clientId) => {
				const allowedClients = ['envval-extension', 'envval-cli'];
				return allowedClients.includes(clientId);
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
				user: sanitizeUser(user as DbUser),
				session: sanitizeSession(session as DbSession),
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

function isExtensionOrCli(userAgent: string | null | undefined): boolean {
	if (!userAgent) return false;
	const ua = userAgent.toLowerCase();
	return ua.includes('envval-extension') || ua.includes('envval-cli');
}

type NotificationPreferences = { newRepoAdded: boolean; newDeviceLogin: boolean };

const DEFAULT_PREFERENCES: NotificationPreferences = { newRepoAdded: true, newDeviceLogin: false };

/**
 * Safely resolves notification preferences from the DB value.
 * Handles both pre-parsed objects and legacy JSON strings.
 */
function parseNotificationPreferences(raw: unknown): NotificationPreferences {
	if (typeof raw === 'object' && raw !== null && 'newDeviceLogin' in raw) {
		return raw as NotificationPreferences;
	}
	if (typeof raw === 'string') {
		try {
			return JSON.parse(raw) as NotificationPreferences;
		} catch {
			return DEFAULT_PREFERENCES;
		}
	}
	return DEFAULT_PREFERENCES;
}

type SessionType = (typeof schema.sessionType.enumValues)[number];

const SESSION_TYPES = new Set<string>(schema.sessionType.enumValues);

function isSessionType(value: unknown): value is SessionType {
	return typeof value === 'string' && SESSION_TYPES.has(value);
}

export type AuthType = typeof auth;

const PROVIDER_LABELS: Record<string, string> = {
	google: 'Google OAuth',
	github: 'GitHub OAuth',
	'email-otp': 'Email OTP',
	credential: 'Email & Password',
};

/**
 * Maps an auth provider ID + session type to a human-readable sign-in label.
 *
 * When `providerId` is undefined the user signed in via email OTP,
 * which does not create an account row in better-auth.
 */
function resolveSignInLabel(providerId: string | undefined, sessionType: SessionType): string {
	const label = providerId ? (PROVIDER_LABELS[providerId] ?? providerId) : 'Email OTP';

	return sessionType === 'SESSION_EXTENSION' ? `${label} (VS Code Extension)` : label;
}
