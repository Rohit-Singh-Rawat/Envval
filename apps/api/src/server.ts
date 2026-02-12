
import app from './app';
import { env } from '@/config/env';

const port = parseInt(env.PORT || '8080', 10);

if (isNaN(port) || port < 1 || port > 65535) {
	throw new Error(`Invalid PORT: ${env.PORT}.`);
}

export default {
	port,
	fetch: app.fetch,
};
