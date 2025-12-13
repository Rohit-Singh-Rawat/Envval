import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { AppEnv } from '@/shared/types/context';
import { corsConfig } from '@/config/cors';
import { errorHandler } from '@/shared/middleware/error.middleware';
import { sessionMiddleware } from '@/shared/middleware/session.middleware';

// API routes
import { apiRoutes } from '@/api';

const app = new Hono<AppEnv>()
	// Global middleware
	.use('*', logger())
	.use('*', cors(corsConfig))
	.use('*', sessionMiddleware)
	.onError(errorHandler)
	// Health check
	.get('/', (c) => {
		return c.json({ message: 'Hello World' });
	})
	// Mount API routes
	.route('/api', apiRoutes);

export default app;
export type AppType = typeof app;
