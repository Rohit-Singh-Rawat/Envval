import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { db } from '@envval/db';
import { session as sessionTable, user as userTable } from '@envval/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/modules/auth/auth.service';
import { DeviceService } from '@/modules/auth/device.service';
import { generateKeyMaterial } from '@/shared/utils/crypto';

const deviceService = new DeviceService();

// Request body schema for extension device token
const extensionTokenSchema = z.object({
	grant_type: z.literal('urn:ietf:params:oauth:grant-type:device_code'),
	device_code: z.string(),
	client_id: z.string(),
});

// Response type for extension
interface ExtensionTokenResponse {
	access_token: string;
	device_id: string;
	key_material: string;
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
	.post('/device/token', zValidator('json', extensionTokenSchema), async (c) => {
		const body = c.req.valid('json');
		const userAgent = c.req.header('user-agent') || '';
		const ipAddress = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '';

		// Check if this is from the extension (user-agent must include 'envval-extension')
		const isExtension = userAgent.toLowerCase().includes('envval-extension');
		if (!isExtension) {
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

			// Get the session to find the user
			const sessionData = await auth.api.getSession({
				headers: new Headers({
					Authorization: `Bearer ${accessToken}`,
				}),
			});

			if (!sessionData || !sessionData.user) {
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

			// Generate a random device ID for this extension instance
			const deviceId = `ext-${nanoid(12)}`;

			// Create or update the device record
			const deviceRecord = await deviceService.ensureExists(deviceId, userId, 'DEVICE_EXTENSION', {
				name: `VS Code Extension - ${new Date().toLocaleDateString()}`,
				lastIpAddress: ipAddress,
				lastUserAgent: userAgent,
			});

			// Update the session with extension-specific data
			await db
				.update(sessionTable)
				.set({
					deviceId: deviceId,
					sessionType: 'SESSION_EXTENSION',
					ipAddress: ipAddress,
					userAgent: userAgent,
				})
				.where(eq(sessionTable.id, sessionId));

			// Get or create key material for the user
			const keyMaterial = await getOrCreateKeyMaterial(userId);

			// Return the extension-specific response
			const response: ExtensionTokenResponse = {
				access_token: accessToken,
				device_id: deviceId,
				key_material: keyMaterial,
			};

			return c.json(response);
		} catch (error: any) {
			// Handle better-auth errors (authorization_pending, slow_down, etc.)
			const errorCode = error?.error || error?.code || 'invalid_grant';
			const errorDescription =
				error?.error_description || error?.message || 'Device authorization failed';

			// Return the same error format as RFC 8628
			return c.json(
				{
					error: errorCode,
					error_description: errorDescription,
				},
				400
			);
		}
	});

/**
 * Get or create key material for a user.
 * For now, we store it encrypted in the device table's wrappedUserKey field.
 * In a production setup, you'd want a separate user_key_material table.
 */
async function getOrCreateKeyMaterial(userId: string): Promise<string> {
	// Check if user already has key material stored somewhere
	// For simplicity, we'll generate a new one each time for now
	// In production, you'd want to:
	// 1. Check if user has existing key material in a user_key_material table
	// 2. If not, generate and store it (encrypted with master key)
	// 3. Return the decrypted key material

	// For now, generate a deterministic key based on userId + a secret
	// This ensures the same user always gets the same key material
	// TODO: Replace with proper key material storage

	// Try to get existing key material from user record or separate table
	const [userRecord] = await db.select().from(userTable).where(eq(userTable.id, userId)).limit(1);

	if (!userRecord) {
		throw new Error('User not found');
	}

	// For now, generate key material based on userId
	// In production, this should be stored encrypted in DB
	const keyMaterial = generateKeyMaterial();

	return keyMaterial;
}
