import type { cors } from 'hono/cors';

type CorsConfig = Parameters<typeof cors>[0];

export const corsConfig: CorsConfig = {
	origin: (origin) => {
		// Allow VS Code extensions (vscode-webview:// scheme)
		if (origin.startsWith('vscode-webview://')) {
			return origin;
		}
		
		// Allow specific domains
		const allowedDomains = ['http://localhost:3000', 'http://localhost:3001'];
		if (allowedDomains.includes(origin)) {
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
