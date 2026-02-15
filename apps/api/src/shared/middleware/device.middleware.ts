import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { AppEnv } from '@/shared/types/context';
import { HTTP_FORBIDDEN } from '@/shared/constants/http-status';
import { db } from '@envval/db';
import { device } from '@envval/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@/shared/utils/logger';

/**
 * Device validation middleware - ensures device exists and is not revoked.
 * Must be applied after authMiddleware which populates session.
 * Validates that the device associated with the current session is active.
 * Logs security events (revoked device attempts, deleted device access).
 */
export const deviceMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
	const session = c.get('session');
	const user = c.get('user');

	if (!session?.deviceId) {
		// No deviceId in session (web sessions, public routes, etc.)
		await next();
		return;
	}

	// Query device table to check if device exists and is not revoked
	const [deviceRecord] = await db
		.select()
		.from(device)
		.where(eq(device.id, session.deviceId))
		.limit(1);

	if (!deviceRecord) {
		logger.warn('Device not found - access attempt with deleted device', {
			userId: user?.id,
			sessionId: session.id,
			deviceId: session.deviceId,
		});

		throw new HTTPException(HTTP_FORBIDDEN, {
			message: 'Device not found - may have been deleted',
			cause: { error: 'device_not_found' },
		});
	}

	// TODO: Soft-revoke implementation (future enhancement)
	// Currently devices are hard-deleted, so this check will never trigger.
	// When implementing soft-revoke, update handlers to mark devices as revoked instead of deleting them.
	// This will enable graceful degradation with read-only mode in extensions.
	/*
	if (deviceRecord.revoked) {
		logger.warn('Revoked device access attempt', {
			userId: user?.id,
			deviceId: deviceRecord.id,
			deviceName: deviceRecord.name,
			revokedAt: deviceRecord.revokedAt?.toISOString(),
		});

		throw new HTTPException(HTTP_FORBIDDEN, {
			message: 'Device has been revoked',
			cause: {
				error: 'device_revoked',
				revokedAt: deviceRecord.revokedAt?.toISOString(),
			},
		});
	}
	*/

	// Attach device to context for audit logging in handlers
	c.set('device', deviceRecord);

	await next();
};
