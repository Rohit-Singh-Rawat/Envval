import { env } from '@/env';
import { createAuthClient } from 'better-auth/react';
import {
	customSessionClient,
	deviceAuthorizationClient,
	emailOTPClient,
} from 'better-auth/client/plugins';
import type { AuthType } from '@envval/api/hc';
export const authClient = createAuthClient({
	/** The base URL of the server (optional if you're using the same domain) */
	baseURL: env.VITE_API_BASE_URL,
	plugins: [
		customSessionClient<AuthType>(),
		deviceAuthorizationClient(),
		emailOTPClient(),
	],
});

export const useSession = authClient.useSession;
