import { honoFactory } from '@/shared/utils/factory';
import { rateLimitMiddleware } from '@/shared/middleware/rate-limit.middleware';
import { sessionApi } from './session.api';
import { oauthApi } from './oauth.api';
import { extensionApi } from './extension.api';
import { keyMaterialApi } from './key-material.api';

export const authRoutes = honoFactory
	.createApp()
	// Brute-force protection on POST only — login, signup, OTP, device auth.
	// GET endpoints (get-session, OAuth callbacks) are exempt; they're read-only
	// and called on every page load / route change from the web server's IP,
	// so a per-IP POST-only limit prevents false 429s in production.
	.use('*', rateLimitMiddleware({ tier: 'auth', by: 'ip', methods: ['POST'] }))
	.route('/session', sessionApi)
	.route('/extension', extensionApi)
	.route('/device/key-material', keyMaterialApi)
	.route('/', oauthApi);
