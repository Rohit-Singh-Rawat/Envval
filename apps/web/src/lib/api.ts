import { hc } from 'hono/client';
import type { AppType } from '@envval/api';
import { env } from '@/env';

const client = hc<AppType>(env.VITE_API_BASE_URL, {
	init: {
		credentials: 'include',
	},
});
export default client;
