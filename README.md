# Envval Monorepo

Envval is a multi-surface developer experience: a Next.js dashboard, a Hono API, a VS Code companion, and a small shared UI toolkit that are all wired together with Turborepo.

## TL;DR

```bash
# install (uses Bun by default)
bun install

# run everything in watch mode
bun run dev

# focus on a single target
bunx turbo dev --filter=web
```

## Repo layout

| Surface | Path | Stack | Notes |
| --- | --- | --- | --- |
| Web app | `apps/web` | Next.js 16 / React 19 | UI for env management, consumes the API and shared UI kit |
| API | `apps/api` | Hono on Node | REST entrypoint with CORS + logging baked in |
| VS Code extension | `apps/extension` | VS Code 1.106, esbuild | Ships commands that integrate Envval flows directly in the editor |
| UI kit | `packages/ui` | React components | Primitive `Button`, `Card`, `Code` shared across surfaces |
| TS configs | `packages/typescript-config` | TS project refs | Reusable `tsconfig` targets for apps, libs, and Next.js |

Everything is TypeScript, linted with ESLint 9, formatted with Prettier 3, and orchestrated through `turbo.json`.

## Requirements

- Node 18+ (same runtime as the deployed API)
- Bun 1.2.8 (the workspace PM); swap to npm/pnpm if you must, but keep the lockfiles in sync
- VS Code 1.106+ if you want to hack on `apps/extension`

## Install once

```bash
bun install
```

This runs workspace-aware installs for every app/package.

## Day-to-day commands

| Action | Command | Notes |
| --- | --- | --- |
| Run every dev target | `bun run dev` | `turbo run dev` with caching disabled for live reloads |
| Run a single app | `bunx turbo dev --filter=<target>` | Examples: `web`, `api`, `extension#watch` |
| Build all artifacts | `bun run build` | Produces `.next`, API `dist`, and extension bundle |
| Type-check everything | `bun run check-types` | Uses each package’s `tsconfig` from `@envval/typescript-config` |
| Lint everything | `bun run lint` | ESLint with `"--max-warnings 0"` in each workspace |
| Format Markdown/TS | `bun run format` | Runs Prettier over code + docs |

## App-specific notes

### Web (`apps/web`)

- Ports: `3000` by default (`npm run dev` inside the app if you prefer local scripts).
- Uses the shared UI kit via the `@envval/ui` workspace alias.
- Type generation: `next typegen` is part of the `check-types` script—keep it up to date before pushes.

### API (`apps/api`)

- Serve with `bunx turbo dev --filter=api` or `cd apps/api && bun run dev`.
- Hono + `@hono/node-server` provides a lightweight fetch-compatible stack.
- Environment: copy `.env.example` → `.env` (create one if missing) and set at least `PORT` (defaults to `8080`).
- `tsx` handles hot-reload during dev; ship builds with `tsc` + `node dist/server.js`.

### VS Code extension (`apps/extension`)

- Build once via `bunx turbo run build --filter=extension`.
- Watch mode for authoring: `cd apps/extension && bun run watch`.
- Tests: `bun run test` uses `@vscode/test-cli`.
- Publishing flow: `bun run package` to emit the signed `.vsix`, then `vsce publish`.

## Shared packages

- `@envval/ui` exposes simple React primitives. Generate new components with `bun run --filter=@envval/ui generate:component`.
- `@envval/typescript-config` holds `base`, `react-library`, and `nextjs` configs. Reference them from any new workspace so every project shares compiler flags.

## Turbo tips

- Filters (`--filter=<target>`) respect dependency graphs, so `--filter=web...` will build the UI kit first if needed.
- Caching is on for `build`, `lint`, and `check-types`; it is intentionally off for `dev` to avoid stale hot reloads.
- Remote caching is ready—just run `bunx turbo login && bunx turbo link` with your Vercel account when you want to hydrate CI caches.

## Contributing

1. Create a feature branch.
2. `bun run dev` (or filter to the surface you need) and keep `bun run check-types && bun run lint` clean.
3. Add/update tests when touching API routes or UI logic.
4. Open a PR with screenshots (web), sample responses (API), or screencasts (extension) as relevant.

## Deployment checklist

- `bun run build` succeeds locally.
- API `.env` matches the deployment target (e.g., Fly.io, Render, Vercel Functions).
- Next.js build artifacts can be deployed on Vercel/Netlify; remember to set `NEXT_PUBLIC_*` envs.
- Extension package is bumped and re-built before uploading to the VS Code marketplace.

Happy shipping! 🚀
