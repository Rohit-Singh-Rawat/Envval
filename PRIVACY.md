# Privacy & Security Statement

**Last Updated:** February 2026

## Our Commitment

Envval is built with security and privacy as core principles. We believe that your environment variables and secrets should remain **yours** — encrypted, private, and under your control.

---

## Data Handling Overview

### What We Encrypt

✅ **Environment file contents** — End-to-end encrypted using AES-256-GCM
✅ **Encryption key material** — Stored only in your VS Code Secret Storage
✅ **User passwords** — Argon2id hashing (never stored in plaintext)
✅ **Device sessions** — Secure tokens with automatic rotation

### What We DON'T Collect

❌ **No telemetry** — The extension sends zero analytics or usage data
❌ **No key escrow** — We cannot decrypt your environment files
❌ **No third-party trackers** — No analytics SDKs or external scripts
❌ **No plaintext secrets** — Variables never leave your machine unencrypted

---

## End-to-End Encryption Architecture

### How Your Data Is Protected

```
┌─────────────────────┐
│ Local .env File     │
│ (plaintext on disk) │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ 1. Derive AES-256 Key (PBKDF2)          │
│    Input: Key Material + User ID        │
│    Output: 256-bit encryption key       │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ 2. Encrypt (AES-256-GCM)                │
│    Algorithm: AES-GCM with random IV    │
│    Output: Ciphertext + IV              │
└──────────┬──────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────┐
│ 3. Upload to Cloud (HTTPS/TLS 1.3)     │
│    Stored Format: ciphertext:iv:hash    │
│    Server CANNOT decrypt (no key)       │
└─────────────────────────────────────────┘
```

### Key Material Storage

- **Key Material**: Randomly generated 32-byte secret (Base64 encoded)
- **Storage Location**: VS Code Secret Storage API (OS-level encryption)
  - **Windows**: Credential Manager (DPAPI)
  - **macOS**: Keychain
  - **Linux**: Secret Service API / kwallet / gnome-keyring
- **Derivation**: PBKDF2-SHA256 (100,000 iterations) derives the actual AES key
- **Access**: Only the authenticated extension process can access secrets

### Why This Is Secure

1. **Zero-Knowledge Architecture**: Envval servers store only ciphertext — decryption is impossible without your key material
2. **Client-Side Encryption**: All encryption/decryption happens locally in the extension
3. **Key Isolation**: Encryption keys never leave your machine or touch the network
4. **Forward Secrecy**: Revoking a device immediately invalidates its sessions

---

## Data We Store on Servers

### Metadata (Unencrypted)

The following metadata is stored to enable synchronization:

- **Repository ID**: Normalized Git remote URL (e.g., `github.com/user/repo`)
- **File name**: Environment file name (e.g., `.env.production`)
- **Content hash**: SHA-256 hash for conflict detection
- **Environment count**: Number of variables (for UI display)
- **Last updated timestamp**: For sync conflict resolution
- **Device metadata**: Device name, last seen IP, user agent (for security audit logs)

**Why**: This metadata enables cross-device sync, conflict detection, and security monitoring without exposing sensitive data.

### Encrypted Data

- **Environment file contents**: AES-256-GCM encrypted ciphertext
- **Initialization Vector (IV)**: Required for decryption (stored alongside ciphertext)

**Security Note**: Ciphertext is computationally infeasible to decrypt without the encryption key.

---

## Authentication & Session Management

### Device Authorization Flow

1. **Device Code Flow** (OAuth 2.0 extension)
   - Extension requests a device code from the server
   - User visits verification URL and approves the device
   - Extension polls for authorization completion
   - Upon approval, server issues a session token

2. **Session Tokens**
   - **Type**: Bearer tokens (256-bit random)
   - **Lifetime**: 30 days (automatically renewed)
   - **Storage**: VS Code Secret Storage (encrypted)
   - **Transmission**: HTTPS only with Secure + HttpOnly cookies

3. **Device Revocation**
   - Users can revoke devices from the web dashboard
   - Revocation immediately invalidates all sessions for that device
   - Extension automatically logs out when session is revoked

### Password Security

- **Hashing Algorithm**: Argon2id (memory-hard, GPU-resistant)
- **Salt**: Unique per-user (128-bit random)
- **Parameters**: Memory cost: 65536 KB, Iterations: 3, Parallelism: 4
- **Storage**: Hashed passwords stored in PostgreSQL (never plaintext)

---

## Network Security

### HTTPS/TLS Configuration

- **Minimum Version**: TLS 1.3
- **Cipher Suites**: Modern, forward-secret ciphers only
- **Certificate Pinning**: Not implemented (relies on OS trust store)
- **HSTS**: Enabled on API endpoints (max-age=31536000)

### CORS Policy

- **Allowed Origins**: Whitelist of verified domains only
- **Credentials**: Required for all authenticated requests
- **Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Headers**: Restricted to necessary auth/content headers

### Rate Limiting

All API endpoints are protected by Redis-backed rate limiting:

| Tier      | Rate Limit  | Applies To                         |
| --------- | ----------- | ---------------------------------- |
| Global    | 100 req/min | All unauthenticated endpoints      |
| API       | 60 req/min  | General authenticated endpoints    |
| Auth      | 20 req/min  | Login, device authorization        |
| Mutation  | 30 req/min  | Create/Update/Delete operations    |
| Sensitive | 10 req/min  | Device revocation, account changes |
| Email     | 5 req/10min | Email sending (OTP, notifications) |

**Protection Against**: Brute force attacks, DDoS, credential stuffing, email spam

---

## Third-Party Services

### Services We Use

| Service               | Purpose                 | Data Shared                        |
| --------------------- | ----------------------- | ---------------------------------- |
| **PostgreSQL (Neon)** | Database                | Encrypted env data, metadata, auth |
| **Redis (Upstash)**   | Rate limiting, sessions | IP addresses (temporary), tokens   |
| **Resend**            | Transactional emails    | Email addresses, magic links       |

### Data Not Shared With Third Parties

❌ Decryption keys
❌ Plaintext environment variables
❌ Analytics or behavioral data
❌ Usage metrics or feature telemetry

---

## User Rights & Data Management

### Your Data, Your Control

You have the right to:

1. **Access**: View all your stored environments and metadata via the web dashboard
2. **Export**: Download encrypted backups (ciphertext + metadata)
3. **Delete**: Permanently delete environments, repositories, or your entire account
4. **Revoke**: Immediately revoke device access and invalidate sessions

### Data Retention

- **Active Environments**: Retained indefinitely while your account is active
- **Deleted Environments**: Immediately removed from database (no soft delete)
- **Revoked Devices**: Audit logs retained for 90 days for security forensics
- **Inactive Accounts**: Accounts inactive for 2 years may be subject to deletion (with advance notice)

### Account Deletion

To delete your account:

1. Visit the web dashboard → Settings → Delete Account
2. Confirm deletion (cannot be undone)
3. All environments, repositories, devices, and sessions are permanently deleted
4. Extension automatically logs out and clears local secrets

---

## Security Incident Response

### Breach Notification

In the unlikely event of a data breach:

1. We will notify affected users within **72 hours** of discovery
2. Notification will include:
   - Nature of the breach
   - Data potentially compromised
   - Recommended actions (e.g., rotate secrets)
3. We will publish a public incident report

### What Happens to Your Secrets

**Because of end-to-end encryption, even in a worst-case breach scenario where an attacker gains full database access, they CANNOT decrypt your environment variables without your encryption key material (which never leaves your machine).**

The maximum damage would be:

- ✅ Metadata exposure (repo names, file names, update times)
- ❌ **NOT** decryption of your secrets

---

## Compliance & Standards

### Security Best Practices

- ✅ **OWASP Top 10**: Protection against injection, XSS, CSRF, etc.
- ✅ **CWE/SANS Top 25**: Mitigation of common software weaknesses
- ✅ **NIST Cybersecurity Framework**: Alignment with identify, protect, detect, respond, recover

### Audits

- **Dependency Scanning**: Automated vulnerability scanning on all dependencies
- **Code Review**: Manual security review for authentication and encryption code
- **Penetration Testing**: Not yet performed (planned for future)

---

## Contact & Reporting

### Security Vulnerability Disclosure

If you discover a security vulnerability:

1. **DO NOT** open a public GitHub issue
2. **Email**: security@envval.com (PGP key available on request)
3. **Include**: Steps to reproduce, impact assessment, suggested fix
4. **Response Time**: We aim to respond within 48 hours

### Responsible Disclosure Policy

- We will acknowledge receipt of your report
- We will provide a timeline for remediation
- We will credit you in our security acknowledgments (unless you prefer anonymity)
- We do **not** currently offer a bug bounty program

### General Privacy Questions

For privacy-related questions (not security vulnerabilities):

- **Email**: privacy@envval.com
- **Response Time**: 5-7 business days

---

## Changes to This Statement

We may update this privacy statement to reflect:

- New features or services
- Changes in security practices
- Legal or regulatory requirements

**Change Notification**: Major changes will be announced via:

- Extension update notification
- Email to registered users
- GitHub release notes

**Effective Date**: Changes take effect 30 days after publication.

---

## Open Source Transparency

Envval is committed to transparency:

- **Extension Source Code**: Available at [github.com/envval/extension](https://github.com/envval/extension)
- **API Source Code**: Available at [github.com/envval/api](https://github.com/envval/api)
- **Encryption Implementation**: Auditable in `/apps/extension/src/utils/crypto.ts`

You can verify our encryption claims by inspecting the source code directly.

---

## Summary

| Question                                 | Answer                                                         |
| ---------------------------------------- | -------------------------------------------------------------- |
| Can Envval see my secrets?               | **No** — End-to-end encryption prevents server-side decryption |
| Are encryption keys stored on servers?   | **No** — Keys remain in your OS-encrypted Secret Storage       |
| Does Envval track my usage?              | **No** — Zero telemetry or analytics                           |
| Can I export my data?                    | **Yes** — Download encrypted backups anytime                   |
| What happens if servers are compromised? | Attackers get ciphertext only (useless without your keys)      |
| How do I delete all my data?             | Account deletion → immediate permanent removal                 |

---

**Questions?** Contact privacy@envval.com
**Last Updated:** February 16, 2026
