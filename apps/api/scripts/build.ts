import * as esbuild from 'esbuild';

await esbuild.build({
	entryPoints: ['src/app.ts'],
	outdir: 'dist',
	platform: 'node',
	format: 'esm',
	bundle: true,
	external: [
		'hono',
		'@hono/zod-validator',
		'@t3-oss/env-core',
		'zod',
		'nanoid',
		'pg',
		'drizzle-orm',
		'bullmq',
		'ioredis',
		'resend',
		'react',
		'react-dom',
		'better-auth',
		'@upstash/ratelimit',
		'@upstash/redis',
	],
	banner: {
		js: `
      import { createRequire } from 'node:module';
      globalThis.require = createRequire(import.meta.url);
    `,
	},
});
