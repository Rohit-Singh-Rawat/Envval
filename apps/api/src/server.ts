import 'dotenv/config';
import { serve } from '@hono/node-server';
import app from './app';
import { env } from '@/config/env';

const port = parseInt(env.PORT || '8080', 10);

if (isNaN(port) || port < 1 || port > 65535) {
	throw new Error(`Invalid PORT: ${env.PORT}.`);
}

serve(
	{
		fetch: app.fetch,
		port,
	},
	(info) => {
		console.log(`Server started successfully at http://localhost:${info.port}`);
	}
);
