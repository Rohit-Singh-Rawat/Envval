import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
	server: {
		DATABASE_URL: z.string().url(),
		UPSTASH_REDIS_REST_URL: z.string().url(),
		UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
		QUEUE_REDIS_URL: z.string().url(),
		RESEND_API_KEY: z.string().min(1),
		EMAIL_FROM: z.string().email(),
		GOOGLE_CLIENT_ID: z.string().min(1),
		GOOGLE_CLIENT_SECRET: z.string().min(1),
		GITHUB_CLIENT_ID: z.string().min(1),
		GITHUB_CLIENT_SECRET: z.string().min(1),
		PORT: z.string().optional(),
		NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
	},
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
