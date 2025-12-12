import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { AppEnv } from '@/shared/types/context';
import { corsConfig } from '@/config/cors';
import { errorHandler } from '@/shared/middleware/error.middleware';
import { sessionMiddleware } from '@/shared/middleware/session.middleware';

// API routes
import { authRoutes } from '@/api/auth/auth.routes';
import { v1Routes } from '@/api/v1';

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
	.route('/api/auth', authRoutes)
	.route('/api/v1', v1Routes);

export default app;
export type AppType = typeof app;
