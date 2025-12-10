import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createAuthMiddleware, jwt } from 'better-auth/plugins';
import { account, jwks, session, sessionType, user, verification } from '@envval/db/schema';
import { ensureDeviceExists } from '../utils/ensure-device-exist';

export const auth = betterAuth({
	database: drizzleAdapter(
		{ user, session, account, verification, jwks },
		{
			provider: 'pg', // or "mysql", "sqlite"
		}
	),
	session: {
		modelName: 'envval_session',
		additionalFields: {
			sessionType: {
				type: sessionType.enumValues,
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
	],
});
