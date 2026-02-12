import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { AppEnv } from '@/shared/types/context';
import { corsConfig } from '@/config/cors';
import { errorHandler } from '@/shared/middleware/error.middleware';
import { sessionMiddleware } from '@/shared/middleware/session.middleware';
import { rateLimitMiddleware } from '@/shared/middleware/rate-limit.middleware';

import { env } from '@/config/env';

// API routes
import { apiRoutes } from '@/api';

const app = new Hono<AppEnv>()
	// Global middleware
	.use('*', logger())
	.use('*', cors(corsConfig))
	// IP-based global rate limit — applied before session lookup to reject abusive traffic early
	.use('/api/*', rateLimitMiddleware({ tier: 'global', by: 'ip' }))
	.use('*', sessionMiddleware)
	.onError(errorHandler)
	// Health check (excluded from rate limiting for load balancer probes)
	.get('/', (c) => {
		return c.json({ message: 'Hello World' });
	})
	// Mount API routes
	.route('/api', apiRoutes);

export default app;
export type AppType = typeof app;
