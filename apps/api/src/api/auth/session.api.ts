import { Hono } from 'hono';
import type { AppEnv } from '@/shared/types/context';

export const sessionApi = new Hono<AppEnv>();

sessionApi.get('/', (c) => {
	const session = c.get('session');
	const user = c.get('user');

	if (!user) {
		return c.body(null, 401);
	}

	return c.json({
		session,
		user,
	});
});

