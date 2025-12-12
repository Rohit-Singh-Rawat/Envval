import type { Context } from 'hono';
import type { auth } from '@/modules/auth/auth.service';

export type AppEnv = {
	Bindings: {
		DATABASE_URL: string;
		UPSTASH_REDIS_REST_URL: string;
		UPSTASH_REDIS_REST_TOKEN: string;
	};
	Variables: {
		user: typeof auth.$Infer.Session.user | null;
		session: typeof auth.$Infer.Session.session | null;
	};
};

export type AppContext = Context<AppEnv>;

