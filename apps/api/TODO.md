# 🛠️ EnvVault API Server

## About

The EnvVault API server is the **backend** for:

- Authenticating users & devices via **access + refresh tokens**.
- Managing **device registrations** and personal access tokens.
- Storing **encrypted env snapshots** + metadata (no plaintext `.env`).
- Supporting **sync flows** for the extension and web app (env init, list, metadata, update).
- Handling **conflict detection** using hashes & timestamps.

---

## TODO – Remaining

### 1. Data Models & Schema

- [ ] **User** (if not provided by Better Auth)
- [ ] **PersonalAccessToken** (schema + table)

*Session, Account, Verification, Device, Environment, EnvVersion, AuditLog — done.*

### 2. Personal Access Token Endpoints

- [ ] `POST /tokens` → create PAT for a logged-in user.
- [ ] `GET /tokens` → list.
- [ ] `DELETE /tokens/:id` or revoke.

*Login, refresh, device registration, key material, env API (GET/POST/PUT/exists/metadata) — done via Better Auth + existing handlers.*
