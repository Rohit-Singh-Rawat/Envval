import { createAuthClient } from 'better-auth/react';
import { env } from '../env';
export const authClient: ReturnType<typeof createAuthClient> = createAuthClient({
	/** The base URL of the server (optional if you're using the same domain) */
	baseURL: env.PUBLIC_SERVER_URL,
});
