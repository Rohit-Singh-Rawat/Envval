import type { cors } from 'hono/cors';

type CorsConfig = Parameters<typeof cors>[0];

export const corsConfig: CorsConfig = {
	origin: ['http://localhost:3000', 'http://localhost:3001'],
	allowHeaders: ['Content-Type', 'Authorization'],
	allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	exposeHeaders: ['Content-Length'],
	maxAge: 600,
	credentials: true,
};
