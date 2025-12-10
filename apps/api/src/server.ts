import 'dotenv/config';
import { serve } from '@hono/node-server';
import app from './index';

const port = parseInt(process.env.PORT || '8080', 10);
if (isNaN(port) || port < 1 || port > 65535) {
	throw new Error(`Invalid PORT: ${process.env.PORT}.`);
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
