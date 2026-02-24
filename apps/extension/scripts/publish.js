#!/usr/bin/env node
/**
 * Packages the extension once, then publishes to VS Code Marketplace and Open VSX.
 *
 * Setup — create apps/extension/.env:
 *   OVSX_PAT=<token>    -> https://open-vsx.org/user-settings/tokens
 *   VSCE_PAT=<token>    -> optional if you already ran: npx @vscode/vsce login
 *
 * First-time Open VSX setup:
 *   npx ovsx create-namespace Envval-ext -p <token>
 *
 * Usage:
 *   bun run publish
 */

"use strict";

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) {return;}

  for (const line of fs.readFileSync(filePath, "utf-8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {continue;}

    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) {continue;}

    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");

    // Existing env vars take precedence over the .env file
    if (key && !(key in process.env)) {process.env[key] = val;}
  }
}

/**
 * Executes a command using an args array.
 * displayArgs allows substituting sensitive values (e.g. tokens) in log output.
 * shell:true is required on Windows for npx/bun to resolve correctly.
 */
function run(label, args, displayArgs = args) {
  console.log(`[${label}] $ ${displayArgs.join(" ")}`);
  const result = spawnSync(args[0], args.slice(1), { stdio: "inherit", shell: true });
  if (result.status !== 0) {
    throw new Error(
      `[${label}] command exited with code ${result.status ?? "unknown"}${result.error ? `: ${result.error.message}` : ""
      }`
    );
  }
  console.log();
}

function publishToMarketplace(vsixFile) {
  run(
    "vsce",
    ["npx", "@vscode/vsce", "publish", "--packagePath", vsixFile, "--no-dependencies"]
  );
}

function publishToOpenVsx(vsixFile, token) {
  run(
    "ovsx",
    ["npx", "ovsx", "publish", vsixFile, "-p", token],
    ["npx", "ovsx", "publish", vsixFile, "-p", "<OVSX_PAT>"]
  );
}

function main() {
  loadEnv(path.join(ROOT, ".env"));

  const args = process.argv.slice(2);
  const onlyVsce = args.includes("--onlyvsce") || args.includes("onlyvsce");
  const onlyOvsx = args.includes("--onlyovsx") || args.includes("onlyovsx") || args.includes("--onlyosvx") || args.includes("onlyosvx");

  const skipVsce = onlyOvsx && !onlyVsce;
  const skipOvsx = onlyVsce && !onlyOvsx;

  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf-8"));
  const vsixFile = `${pkg.name}-${pkg.version}.vsix`;

  console.log(`Publishing ${pkg.name}@${pkg.version}\n`);

  run("package", ["bun", "run", "package"]);

  if (!fs.existsSync(path.join(ROOT, vsixFile))) {
    throw new Error(`Build succeeded but .vsix not found: ${vsixFile}`);
  }

  if (!skipVsce) {
    try {
      publishToMarketplace(vsixFile);
      console.log("VS Code Marketplace: published\n");
    } catch (err) {
      console.error("VS Code Marketplace: publish failed —", err.message);
      process.exit(1);
    }
  } else {
    console.log("VS Code Marketplace: skipped (due to flags)\n");
  }

  if (!skipOvsx) {
    const ovsxToken = process.env.OVSX_PAT;
    if (!ovsxToken) {
      console.warn("Open VSX: skipped (OVSX_PAT not set)");
      console.warn("  Add OVSX_PAT=<token> to apps/extension/.env\n");
    } else {
      try {
        publishToOpenVsx(vsixFile, ovsxToken);
        console.log("Open VSX: published\n");
      } catch (err) {
        console.error("Open VSX: publish failed —", err.message);
        process.exit(1);
      }
    }
  } else {
    console.log("Open VSX: skipped (due to flags)\n");
  }

  console.log(`Done: ${pkg.name}@${pkg.version}`);
}

try {
  main();
} catch (err) {
  console.error("Error:", err.message ?? err);
  process.exit(1);
}
