# EnvVault — Secure Environment Variable Management for VS Code

**Stop committing secrets to Git. Start syncing them securely.**

EnvVault is a production-grade VS Code extension that automatically synchronizes your `.env` files across devices with military-grade encryption. Your secrets stay encrypted — we can't read them, and neither can anyone else.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![VS Code Marketplace](https://img.shields.io/badge/VS%20Code-Install-blue)](https://marketplace.visualstudio.com/items?itemName=envval.extension)

---

## ✨ Features

### 🔒 **End-to-End Encryption**
- **AES-256-GCM** encryption — industry-standard, used by banks and militaries
- **Zero-knowledge architecture** — your secrets never touch our servers in plaintext
- **Client-side only** — encryption keys never leave your machine
- Learn more in our [Privacy & Security Statement](../../PRIVACY.md)

### 🔄 **Automatic Sync**
- **Real-time sync** across all your devices (desktop, laptop, work machine)
- **Conflict detection** with optimistic locking (no lost changes)
- **Offline support** — changes queue automatically when you're offline
- **Background polling** — stay up-to-date without lifting a finger

### 🏗️ **Smart Repository Detection**
- **Monorepo support** — handles Nx, Turborepo, Lerna, pnpm workspaces
- **Git-aware** — automatically identifies repos by remote URL
- **Submodules & worktrees** — works with complex Git setups
- **Content signatures** — even works with local-only projects

### 🌳 **Multiple .env Files**
- **All variants** — `.env.local`, `.env.production`, `.env.staging`, you name it
- **Workspace tree view** — see all tracked environments at a glance
- **Metadata tracking** — variable counts, last sync time, file size

### ⚡ **Developer Experience**
- **Hover tooltips** — see variable values inline (with smart masking for secrets)
- **Status bar integration** — connection status, sync progress, conflict alerts
- **Quick sync actions** — force sync, view logs, manage devices
- **Zero config** — works out of the box, customize if you want

---

## 📦 Installation

### From VS Code Marketplace

1. Open VS Code
2. Press `Ctrl+P` (Windows/Linux) or `Cmd+P` (macOS)
3. Type `ext install envval.extension`
4. Press Enter

**OR**

1. Open Extensions sidebar (`Ctrl+Shift+X` / `Cmd+Shift+X`)
2. Search for "EnvVault"
3. Click **Install**

### From VSIX (Manual Install)

1. Download the `.vsix` file from [GitHub Releases](https://github.com/envvault/extension/releases)
2. Open VS Code
3. Extensions → `...` menu → **Install from VSIX...**
4. Select the downloaded file

---

## 🚀 Quick Start (60 seconds)

### 1. Sign In

- Open the **EnvVault** sidebar (activity bar icon)
- Click **Sign In to Start Syncing**
- Authorize the device via the browser link

![Sign In Flow](./assets/screenshots/sign-in.png) *(Screenshot placeholder)*

### 2. Initialize Your First Environment

- Open a project with a `.env` file
- EnvVault automatically detects it and prompts you
- Click **Initialize** to encrypt and upload

![Initialize Environment](./assets/screenshots/initialize.png) *(Screenshot placeholder)*

### 3. Sync Across Devices

- Install EnvVault on another machine
- Sign in with the same account
- Your `.env` files appear automatically

That's it! 🎉 Your secrets are now synced and encrypted.

---

## 🎛️ Configuration

EnvVault works great with zero configuration, but you can customize it:

### Extension Settings

Access via `Settings` → `Extensions` → `EnvVault`:

| Setting                          | Type    | Default | Description                                                                 |
|----------------------------------|---------|---------|-----------------------------------------------------------------------------|
| `envval.autoDetectMonorepo`      | boolean | `true`  | Automatically detect monorepo structure and prompt for sub-project selection |
| `envval.preferredRemote`         | string  | `"origin"` | Preferred Git remote for repo identification (`origin`, `upstream`, `any`) |
| `envval.promptForMigration`      | boolean | `true`  | Prompt when repo identity changes (e.g., adding a Git remote)              |
| `envval.hover.enabled`           | boolean | `true`  | Show variable values on hover in code                                       |
| `envval.hover.showValues`        | boolean | `true`  | Display actual values (false = always mask)                                 |
| `envval.hover.maskSensitive`     | boolean | `true`  | Auto-mask values for keys with `KEY`, `SECRET`, `PASSWORD`, `TOKEN`, etc.   |
| `envval.hover.showUndefined`     | boolean | `true`  | Show hover for variables not defined in any .env file                      |

### Example `settings.json`

```json
{
  "envval.autoDetectMonorepo": true,
  "envval.preferredRemote": "origin",
  "envval.hover.maskSensitive": true
}
```

---

## 📋 Commands

Access via Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

| Command                          | Description                                                      |
|----------------------------------|------------------------------------------------------------------|
| `EnvVal: Show Quick Sync Action` | Quick actions menu (sync, view logs, logout)                    |
| `EnvVal: Force Sync`             | Manually trigger sync for all environments                      |
| `EnvVal: Show Logs`              | Open output channel with detailed logs                          |
| `EnvVal: Logout`                 | Sign out and clear all local secrets                            |
| `EnvVal: View Repository Identity` | Display current repo detection details                        |
| `EnvVal: Set Manual Repository Identity` | Override automatic repo detection                     |
| `EnvVal: Set Sub-Project Path`   | Configure monorepo sub-project path                            |
| `EnvVal: Reset Repository Identity` | Return to automatic detection                               |
| `EnvVal: Diagnose Repository Detection` | Comprehensive diagnostic report for troubleshooting  |
| `EnvVal: Retry Connection`       | Manually retry connection (when offline)                       |

---

## 🛠️ Troubleshooting

### Common Issues

#### 🔴 "Device has been revoked" Error

**Cause**: You revoked this device from the web dashboard.

**Solution**:
1. Run `EnvVal: Logout` to clear local state
2. Sign in again to authorize a new device

---

#### 🔴 Environment Not Syncing

**Symptoms**: Local changes not uploading, or remote changes not appearing.

**Solutions**:

1. **Check connection status** (status bar icon):
   - 🟢 Green checkmark = synced
   - 🔵 Spinning sync = syncing in progress
   - 🟡 Cloud-offline = connection lost (changes queued)
   - 🔴 Warning = error (click for details)

2. **Force sync**: Run `EnvVal: Force Sync`

3. **Check logs**: Run `EnvVal: Show Logs` to see detailed sync activity

4. **Verify authentication**: Status bar shows "$(circle-slash) EnvVault" when not signed in

---

#### 🔴 Conflict Detected

**Cause**: Same `.env` file was modified on multiple devices simultaneously.

**What happens**:
- EnvVault detects the conflict using optimistic locking
- Prompts you to choose:
  - **Use Local** (overwrite remote with your changes)
  - **Use Remote** (discard local changes, pull remote)
  - **Cancel** (resolve manually)

**Prevention**: Force sync before making changes on a new device.

---

#### 🔴 Wrong Repository Identity

**Symptoms**: Environments from different projects are mixed, or identity changed unexpectedly.

**Diagnosis**:
1. Run `EnvVal: View Repository Identity`
2. Check current detection method (Git remote, content signature, etc.)

**Solutions**:
- **For monorepos**: Run `EnvVal: Set Sub-Project Path` to distinguish sub-projects
- **For custom identity**: Run `EnvVal: Set Manual Repository Identity`
- **For Git remote changes**: Run `EnvVal: Migrate Repository Identity`

---

#### 🔴 Extension Not Activating

**Symptom**: EnvVault sidebar is missing or commands don't work.

**Solutions**:
1. Reload window: `Ctrl+Shift+P` → `Developer: Reload Window`
2. Check VS Code version (minimum: 1.106.1)
3. Check extension output: `Output` panel → `EnvVault`

---

### Advanced Diagnostics

Run `EnvVal: Diagnose Repository Detection` for a comprehensive report including:

- Current repository identity
- Git remote analysis
- Monorepo structure detection
- Stored metadata counts
- Configuration settings
- Recent identity changes

---

## 🔐 Security & Privacy

### How Secure Is EnvVault?

- ✅ **End-to-end encrypted** (AES-256-GCM)
- ✅ **Zero-knowledge architecture** (we can't decrypt your secrets)
- ✅ **Client-side encryption** (keys never leave your machine)
- ✅ **No telemetry** (zero data collection)
- ✅ **Open source** (verify the code yourself)

Read our full [Privacy & Security Statement](../../PRIVACY.md) for technical details.

### What Data Does EnvVault Store?

**Encrypted (server-side)**:
- Environment file contents (AES-256-GCM ciphertext)

**Unencrypted metadata (server-side)**:
- Repository ID (e.g., `github.com/user/repo`)
- File name (e.g., `.env.production`)
- Content hash (SHA-256, for conflict detection)
- Variable count, last updated timestamp

**Local only (never leaves your machine)**:
- Encryption keys (stored in OS-encrypted Secret Storage)
- Session tokens (stored in VS Code Secret Storage)

### Can EnvVault Read My Secrets?

**No.** Our servers only store ciphertext. Decryption happens locally in the extension using keys that never leave your machine. Even if our database was compromised, your secrets would remain encrypted and unreadable.

---

## 🏢 Use Cases

### Individual Developers
- Sync `.env` files between work laptop and personal desktop
- Recover `.env` files when switching machines
- Never lose secrets when reformatting or getting a new computer

### Teams
- Share environment variables across team members
- Onboard new developers in seconds (no manual `.env` setup)
- Keep staging/production secrets in sync

### Freelancers
- Manage environment variables across multiple client projects
- Switch between projects without hunting for old `.env` files
- Keep backups of all client configurations

---

## 📚 How It Works (Technical Overview)

### Encryption Flow

```
┌─────────────────────┐
│  Local .env File    │
│  (plaintext)        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────────┐
│  1. Read file content                       │
│  2. Derive AES-256 key (PBKDF2, 100k iter)  │
│  3. Encrypt with AES-GCM + random IV        │
│  4. Compute SHA-256 hash for sync           │
└──────────┬──────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────┐
│  Upload via HTTPS (TLS 1.3)                 │
│  Payload: { ciphertext, iv, hash }          │
└──────────┬──────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────┐
│  Server stores ciphertext (can't decrypt)   │
└─────────────────────────────────────────────┘
```

### Sync Conflict Resolution

EnvVault uses **optimistic locking** with base hash validation:

1. Extension reads local `.env` file
2. Computes hash and sends `{ baseHash, newHash, ciphertext }`
3. Server compares `baseHash` with stored hash:
   - ✅ **Match** → update accepted
   - ❌ **Mismatch** → HTTP 412 Precondition Failed (conflict)
4. On conflict, user chooses local or remote version

### Offline Support

When offline:
- Local changes are queued in memory
- Status bar shows "Offline" indicator
- Connection monitor detects when internet returns
- Queued operations automatically process on reconnect

---

## 🗺️ Roadmap

- [ ] **Team workspaces** — Share environments with team members
- [ ] **Secret rotation alerts** — Remind to rotate secrets periodically
- [ ] **Integration with password managers** — Import from 1Password, Bitwarden
- [ ] **Git hooks** — Auto-sync on git checkout/pull
- [ ] **VS Code profiles** — Sync different environments per workspace
- [ ] **Mobile companion app** — View (read-only) environments on iOS/Android

---

## 🤝 Contributing

EnvVault is open source! Contributions are welcome.

### Reporting Issues

Found a bug? Have a feature request?

1. Check [existing issues](https://github.com/envvault/extension/issues)
2. Open a new issue with:
   - Clear description
   - Steps to reproduce (for bugs)
   - VS Code version, OS, extension version
   - Logs (from `EnvVal: Show Logs`)

### Security Vulnerabilities

**DO NOT** open public issues for security vulnerabilities.

Email: security@envvault.io

See our [Security Policy](../../PRIVACY.md#contact--reporting) for responsible disclosure.

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

EnvVault is licensed under the [MIT License](../../LICENSE).

```
Copyright (c) 2025 EnvVault

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...
```

See [LICENSE](../../LICENSE) for full text.

---

## 🌟 Support & Community

- **Documentation**: [docs.envvault.io](https://docs.envvault.io)
- **GitHub**: [github.com/envvault/extension](https://github.com/envvault/extension)
- **Issues**: [github.com/envvault/extension/issues](https://github.com/envvault/extension/issues)
- **Email**: support@envvault.io
- **Twitter**: [@envvault](https://twitter.com/envvault)

---

## 🙏 Acknowledgments

Built with:
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Crypto (Web Crypto API)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Axios](https://axios-http.com/)
- [Hono](https://hono.dev/) (API server)
- [Better-Auth](https://www.better-auth.com/) (Authentication)

Special thanks to the open-source community for making this possible.

---

**Made with ❤️ for developers who care about security**

[Install Now](https://marketplace.visualstudio.com/items?itemName=envval.extension) | [View Source](https://github.com/envvault/extension) | [Report Issue](https://github.com/envvault/extension/issues)
