import type { cors } from 'hono/cors';
import { env } from './env';

type CorsConfig = Parameters<typeof cors>[0];

const getAllowedOrigins = (): string[] => {
	const origins: string[] = [];

	// Always allow localhost in development
	if (env.NODE_ENV === 'development') {
		origins.push('http://localhost:3000', 'http://localhost:3001');
	}

	// Add production domains from env
	if (env.CORS_ORIGINS) {
		const envOrigins = env.CORS_ORIGINS.split(',')
			.map((o) => o.trim())
			.filter(Boolean);
		origins.push(...envOrigins);
	}

	// Always include APP_URL
	origins.push(env.APP_URL);

	return [...new Set(origins)]; // Remove duplicates
};

export const corsConfig: CorsConfig = {
	origin: (origin) => {
		// Allow VS Code extensions (vscode-webview:// scheme)
		if (origin?.startsWith('vscode-webview://')) {
			return origin;
		}

		// Allow requests with no origin (e.g., mobile apps, Postman)
		if (!origin) {
			return env.NODE_ENV === 'development' ? '*' : null;
		}

		const allowedOrigins = getAllowedOrigins();
		if (allowedOrigins.includes(origin)) {
			return origin;
		}

		// Reject all other origins
		return null;
	},
	allowHeaders: ['Content-Type', 'Authorization'],
	allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	exposeHeaders: ['Content-Length'],
	maxAge: 600,
	credentials: true,
};
