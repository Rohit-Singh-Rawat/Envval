import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/app.ts"],
  outdir: "dist",
  platform: "node",
  format: "esm",
  bundle: true,
  external: ["hono"],
});