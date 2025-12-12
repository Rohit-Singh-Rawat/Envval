import type { MiddlewareHandler } from 'hono';
import type { AppEnv } from '@/shared/types/context';
import { auth } from '@/modules/auth/auth.service';

export const sessionMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });

	if (!session) {
		c.set('user', null);
		c.set('session', null);
		await next();
		return;
	}

	c.set('user', session.user);
	c.set('session', session.session);
	await next();
};
