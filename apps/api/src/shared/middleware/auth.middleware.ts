import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { AppEnv } from '@/shared/types/context';

export const authMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
	const user = c.get('user');
	const session = c.get('session');

	if (!user || !session) {
		throw new HTTPException(401, { message: 'Unauthorized' });
	}

	await next();
};
