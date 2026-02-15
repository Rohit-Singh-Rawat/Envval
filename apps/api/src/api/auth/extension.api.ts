import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { db } from '@envval/db';
import { session as sessionTable, user as userTable } from '@envval/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/modules/auth/auth.service';
import { DeviceService } from '@/modules/auth/device.service';
import { decryptKeyMaterialWithMaster, wrapKeyMaterialForDevice } from '@/shared/utils/crypto';
import { logger } from '@/shared/utils/logger';

import { rateLimitMiddleware } from '@/shared/middleware/rate-limit.middleware';
import { HTTP_UNAUTHORIZED } from '@/shared/constants/http-status';

const SESSION_RENEWAL_DAYS = 30;
const MAX_SESSION_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days absolute max age


const deviceService = new DeviceService();

// Request body schema for extension device token
const extensionTokenSchema = z.object({
	grant_type: z.literal('urn:ietf:params:oauth:grant-type:device_code'),
	device_code: z.string(),
	client_id: z.string(),
	public_key: z.string().min(1, 'Public key is required'),
});

// Response type for extension
interface ExtensionTokenResponse {
	access_token: string;
	device_id: string;
	user_id: string; // For PBKDF2 salt in key derivation
	wrapped_key_material: string; // RSA-OAEP encrypted with device's public key
}

export const extensionApi = new Hono()
	/**
	 * Custom device token endpoint for extension.
	 * Wraps better-auth's deviceToken and adds:
	 * - Random device ID generation
	 * - SESSION_EXTENSION type
	 * - Device record creation
	 * - Key material provisioning
	 */
	.post(
		'/device/token',
		rateLimitMiddleware({ tier: 'auth', by: 'ip' }), // Strict IP limit for token generation
		zValidator('json', extensionTokenSchema),
		async (c) => {
		const body = c.req.valid('json');
		const userAgent = c.req.header('user-agent') || '';
		const ipAddress = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '';
		logger.info('Extension device token request received', { clientId: body.client_id });
		// Check if this is from the extension (user-agent must include 'envval-extension')
		const isExtension = userAgent.toLowerCase().includes('envval-extension');
		if (!isExtension) {
			logger.warn('Non-extension client attempted to use extension endpoint', { userAgent });
			return c.json(
				{
					error: 'invalid_request',
					error_description:
						'This endpoint is only for the EnvVal extension. Set User-Agent to include "envval-extension".',
				},
				400
			);
		}

		try {
			// Call better-auth's deviceToken endpoint
			logger.debug('Calling better-auth deviceToken endpoint');
			const result = await auth.api.deviceToken({
				body: {
					grant_type: body.grant_type,
					device_code: body.device_code,
					client_id: body.client_id,
				},
			});

			// If we get here, the device was approved and we have a session
			// The result contains access_token, token_type, expires_in, scope
			const accessToken = result.access_token;
			logger.info('Device authorization successful, access token received', { accessToken });

			// Get the session to find the user
			const sessionData = await auth.api.getSession({
				headers: new Headers({
					Authorization: `Bearer ${accessToken}`,
				}),
			});

			if (!sessionData || !sessionData.user) {
				logger.error('Failed to get session after device authorization');
				return c.json(
					{
						error: 'invalid_grant',
						error_description: 'Failed to get session after device authorization',
					},
					400
				);
			}

			const userId = sessionData.user.id;
			const sessionId = sessionData.session.id;
			logger.info('Session retrieved', { userId, sessionId });

			// Generate a random device ID for this extension instance
			const deviceId = `ext-${nanoid(12)}`;
			logger.debug('Generated device ID', { deviceId });

			// Create or update the device record
			const deviceRecord = await deviceService.ensureExists(deviceId, userId, 'DEVICE_EXTENSION', {
				name: `VS Code Extension - ${new Date().toLocaleDateString()}`,
				lastIpAddress: ipAddress,
				lastUserAgent: userAgent,
			});
			logger.info('Device record created/updated', { deviceId, userId });

			// Get the user's decrypted key material
			const keyMaterial = await getUserKeyMaterial(userId);
			logger.debug('User key material retrieved');

			// Wrap key material with the device's public key (RSA-OAEP)
			const wrappedKeyMaterial = wrapKeyMaterialForDevice(body.public_key, keyMaterial);
			logger.debug('Key material wrapped for device');

			// Update the session with extension-specific data
			await db
				.update(sessionTable)
				.set({
					deviceId: deviceId,
					sessionType: 'SESSION_EXTENSION',
					ipAddress: ipAddress,
					userAgent: userAgent,
					publicKey: body.public_key,
					keyMaterialDelivered: true,
					keyMaterialDeliveredAt: new Date(),
				})
				.where(eq(sessionTable.id, sessionId));
			logger.info('Session updated with extension data', { sessionId, deviceId });

			// Return the extension-specific response
			const response: ExtensionTokenResponse = {
				access_token: accessToken,
				device_id: deviceId,
				user_id: userId, // Add userId for PBKDF2 salt
				wrapped_key_material: wrappedKeyMaterial,
			};

			logger.info('Extension device token response sent successfully', { deviceId });
			return c.json(response);
		} catch (error: any) {
			// Handle better-auth errors (authorization_pending, slow_down, etc.)
			const errorCode = error?.error || error?.code || 'invalid_grant';
			const errorDescription =
				error?.error_description || error?.message || 'Device authorization failed';

			logger.error('Extension device token error', {
				errorCode,
				errorDescription,
				error: error?.message,
			});

			// Return the same error format as RFC 8628
			return c.json(
				{
					error: errorCode,
					error_description: errorDescription,
				},
				400
			);
		}
	})
	/**
	 * Refreshes an extension session with token rotation (RFC 9700).
	 * Bypasses better-auth's getSession (which rejects expired tokens) and
	 * queries the session table directly. This allows renewal of naturally
	 * expired sessions while rejecting revoked ones (deleted from DB).
	 *
	 * Issues a NEW token on every refresh — the old token is immediately
	 * invalidated. This limits the exposure window if a token is stolen
	 * and satisfies RFC 9700's rotation requirement for public clients.
	 */
	.post('/device/refresh-session', rateLimitMiddleware({ tier: 'mutation', by: 'ip' }), async (c) => {
		const authHeader = c.req.header('authorization');
		if (!authHeader?.startsWith('Bearer ')) {
			return c.json({ error: 'missing_token', error_description: 'Bearer token required' }, 401);
		}

		const token = authHeader.slice(7);

		const [sessionRecord] = await db
			.select({
				id: sessionTable.id,
				token: sessionTable.token,
				sessionType: sessionTable.sessionType,
				userId: sessionTable.userId,
				createdAt: sessionTable.createdAt,
			})
			.from(sessionTable)
			.where(and(eq(sessionTable.token, token), eq(sessionTable.sessionType, 'SESSION_EXTENSION')))
			.limit(1);

		if (!sessionRecord) {
			logger.info('Extension session refresh rejected: session not found or revoked');
			return c.json({ error: 'session_revoked', error_description: 'Session has been revoked or does not exist' }, 401);
		}

		if (Date.now() - sessionRecord.createdAt.getTime() > MAX_SESSION_AGE_MS) {
			logger.warn('Extension session refresh rejected: session max age exceeded', {
				sessionId: sessionRecord.id,
				ageDays: Math.round((Date.now() - sessionRecord.createdAt.getTime()) / (24 * 60 * 60 * 1000)),
			});
			return c.json(
				{
					error: 'session_expired',
					error_description: 'Session too old, please sign in again',
				},
				HTTP_UNAUTHORIZED
			);
		}

		const newToken = nanoid(32);
		const newExpiresAt = new Date(Date.now() + SESSION_RENEWAL_DAYS * 24 * 60 * 60 * 1000);

		await db
			.update(sessionTable)
			.set({ token: newToken, expiresAt: newExpiresAt, updatedAt: new Date() })
			.where(eq(sessionTable.id, sessionRecord.id));

		logger.info('Extension session refreshed with token rotation', {
			sessionId: sessionRecord.id,
			userId: sessionRecord.userId,
			newExpiresAt: newExpiresAt.toISOString(),
		});

		return c.json({ access_token: newToken });
	});

/**
 * Get the user's key material for the extension.
 * Decrypts the user's stored key material using the server's master key.
 *
 * Unlike web (which uses RSA wrapping for IndexedDB storage), the extension
 * stores directly in VS Code's SecretStorage which uses OS-level encryption.
 */
async function getUserKeyMaterial(userId: string): Promise<string> {
	const [userRecord] = await db
		.select({
			keyMaterialEnc: userTable.keyMaterialEnc,
			keyMaterialIv: userTable.keyMaterialIv,
		})
		.from(userTable)
		.where(eq(userTable.id, userId))
		.limit(1);

	if (!userRecord) {
		logger.error('User not found when retrieving key material', { userId });
		throw new Error('User not found');
	}

	if (!userRecord.keyMaterialEnc || !userRecord.keyMaterialIv) {
		logger.error('User key material not initialized', { userId });
		throw new Error('User key material not initialized');
	}

	// Decrypt user's keyMaterial using server's master key
	const keyMaterial = decryptKeyMaterialWithMaster(
		userRecord.keyMaterialEnc,
		userRecord.keyMaterialIv
	);

	return keyMaterial;
}
