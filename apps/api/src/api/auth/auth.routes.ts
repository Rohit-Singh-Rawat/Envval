import { honoFactory } from '@/shared/utils/factory';
import { rateLimitMiddleware } from '@/shared/middleware/rate-limit.middleware';
import { sessionApi } from './session.api';
import { oauthApi } from './oauth.api';
import { extensionApi } from './extension.api';
import { keyMaterialApi } from './key-material.api';

export const authRoutes = honoFactory
	.createApp()
	// Strict IP-based rate limit on all auth endpoints — brute force protection
	.use('*', rateLimitMiddleware({ tier: 'auth', by: 'ip' }))
	.route('/session', sessionApi)
	.route('/extension', extensionApi)
	.route('/device/key-material', keyMaterialApi)
	.route('/', oauthApi);
