import { env } from '@/env';
import { createAuthClient } from 'better-auth/react';
import { jwtClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
	/** The base URL of the server (optional if you're using the same domain) */
	baseURL: env.VITE_API_BASE_URL,
	plugins: [jwtClient()],
});

export const useSession = authClient.useSession;
