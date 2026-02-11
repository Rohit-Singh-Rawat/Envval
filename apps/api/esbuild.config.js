import esbuild from 'esbuild';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

// Only externalize npm packages, NOT workspace packages (they need to be bundled)
// Workspace packages start with @envval/ and export .ts files
const allDeps = [
	...Object.keys(pkg.dependencies || {}),
	...Object.keys(pkg.peerDependencies || {}),
];

// Filter out workspace packages - bundle them instead
const external = allDeps.filter(dep => !dep.startsWith('@envval/'));

esbuild.build({
	entryPoints: ['src/server.ts'],
	bundle: true,
	platform: 'node',
	format: 'esm',
	target: 'node20',
	outfile: 'dist/server.js',
	external,
	alias: {
		'@': resolve('./src'),
	},
	keepNames: true,
	sourcemap: true,
	minify: false,
}).catch(() => process.exit(1));
