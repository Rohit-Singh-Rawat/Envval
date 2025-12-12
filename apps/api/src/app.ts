import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { AppEnv } from '@/shared/types/context';
import { corsConfig } from '@/config/cors';
import { errorHandler } from '@/shared/middleware/error.middleware';
import { sessionMiddleware } from '@/shared/middleware/session.middleware';

// API routes
import { authRoutes } from '@/api/auth/auth.routes';

const app = new Hono<AppEnv>();

// Global middleware
app.use('*', logger());
app.use('*', cors(corsConfig));
app.use('*', sessionMiddleware);
app.onError(errorHandler);

// Health check
app.get('/', (c) => {
	return c.json({ message: 'Hello World' });
});

// Mount API routes
app.route('/api/auth', authRoutes);

// API v1 routes (for future features)
const v1 = new Hono<AppEnv>();
app.route('/api/v1', v1);

export default app;
