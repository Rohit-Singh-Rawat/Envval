import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

app.use('*', logger());
app.use(
	'*',
	cors({
		origin: ['http://localhost:3000', 'http://localhost:3001'],
		allowHeaders: ['Content-Type', 'Authorization'],
		allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	})
);

app.get('/', (c) => {
	return c.json({ message: 'Hello World' });
});

const v1 = new Hono();

app.route('/api/v1', v1);

export default app;
