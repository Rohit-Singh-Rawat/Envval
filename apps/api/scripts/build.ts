import * as esbuild from 'esbuild';

await esbuild.build({
	entryPoints: ['src/app.ts'],
	outdir: 'dist',
	platform: 'node',
	format: 'esm',
	bundle: true,
	external: ['hono', 'pg', 'drizzle-orm', '@envval/db', '@envval/email', '@envval/queue'],
});
