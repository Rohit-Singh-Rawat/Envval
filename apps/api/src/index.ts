import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { auth } from './auth/index';

const app = new Hono<{
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null;
	};
}>();

app.use('*', logger());
app.use(
	'*',
	cors({
		origin: ['http://localhost:3000', 'http://localhost:3001'],
		allowHeaders: ['Content-Type', 'Authorization'],
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		exposeHeaders: ['Content-Length'],
		maxAge: 600,
		credentials: true,
	})
);
app.use('*', async (c, next) => {
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
});

app.get('/session', (c) => {
	const session = c.get('session');
	const user = c.get('user');

	if (!user) return c.body(null, 401);

	return c.json({
		session,
		user,
	});
});

app.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw));

app.get('/', (c) => {
	return c.json({ message: 'Hello World' });
});

const v1 = new Hono();

app.route('/api/v1', v1);

export default app;
