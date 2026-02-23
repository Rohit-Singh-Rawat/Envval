# Envval — Secure Environment Variable Management

**Stop committing secrets to Git. Start syncing them securely.**

<p align="center">
  <img src="./assets/envval.gif" alt="Envval Demo" width="100%" />
</p>

Envval is a production-grade VS Code extension that automatically synchronizes your `.env` files across devices with military-grade encryption. Your secrets stay encrypted — we can't read them, and neither can anyone else.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../../LICENSE)
[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Install-blue)](https://marketplace.visualstudio.com/items?itemName=Envval-ext.Envval-ext)

---

## ✨ Features

- **End-to-End Encryption**: AES-256-GCM encryption ensures your secrets never touch our servers in plaintext. Keys never leave your machine.
- **Automatic Sync**: Real-time sync across all your devices with offline support and conflict detection.
- **Smart Repository Detection**: Works out of the box with monorepos (Nx, Turborepo, Lerna, pnpm workspaces) and complex Git setups.
- **Developer Experience**: Inline hover tooltips for variables (with smart masking), status bar integration, and zero config required.
- **Multiple .env Files**: Full support for all variants like `.env.local`, `.env.production`, etc., visible in a dedicated workspace tree view.

## 🚀 Quick Start

1. Install "Envval" from the Extensions sidebar.
2. Open the **Envval** sidebar and click **Sign In to Start Syncing**.
3. Open a project with a `.env` file — click **Initialize** to encrypt and upload.
4. Sign in on your other devices to see your `.env` files appear automatically!

## 🎛️ Configuration

Envval works great with zero configuration, but you can customize features like auto-detection and hover behaviors via `Settings` → `Extensions` → `Envval`.

## 📋 Commands

Access useful commands via the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`), such as:

- `EnvVal: Show Quick Sync Action`
- `EnvVal: Force Sync`
- `EnvVal: Logout`

## 🔐 Security & Privacy

Your security is our priority. Envval uses **end-to-end client-side encryption**, meaning we have **zero knowledge** of your secrets. We collect no telemetry. For full technical details, see our [Privacy & Security Statement](../../PRIVACY.md).

---

**Made with ❤️ for developers who care about security**

[Install Now](https://marketplace.visualstudio.com/items?itemName=Envval-ext.Envval-ext) | [View Source](https://github.com/envval/extension) | [Report Issue](https://github.com/envval/extension/issues)
