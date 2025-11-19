# 🛠️ EnvVault API Server

## About

The EnvVault API server is the **backend** for:

- Authenticating users & devices via **access + refresh tokens**.
- Managing **device registrations** and personal access tokens.
- Storing **encrypted env snapshots** + metadata (no plaintext `.env`).
- Supporting **sync flows** for the extension and web app (env init, list, metadata, update).
- Handling **conflict detection** using hashes & timestamps.

---

## TODO – API Server (New Architecture)

### 1. Project & Infrastructure Setup

- [ ] Bootstrap Node.js + TypeScript server (Fastify/Express/Hono).
- [ ] Environment configuration:
  - Port, DB connection URL, JWT/crypto secrets, CORS config.
- [ ] Global error handling + logging middleware.
- [ ] Health check route (`/health`).

---

### 2. Data Models & Schema

- [ ] **User**
  - `id`, `email`, `passwordHash` (if using password), `createdAt`.
- [ ] **Device**
  - `id`, `userId`, `name` (e.g. "Rohit’s Laptop"), `createdAt`, `lastSeenAt`, `revoked`.
- [ ] **Token / Session**
  - `id`, `userId`, `deviceId`, `refreshToken` (hashed), `expiresAt`, `revoked`.
- [ ] **PersonalAccessToken (optional)**
  - `id`, `userId`, `label`, `token` (hashed), `createdAt`, `lastUsedAt`, `revoked`.
- [ ] **Environment**
  - `id` (envId), `userId`, `repoId`, `fileName`, `latestHash`, `createdAt`, `updatedAt`.
- [ ] **EnvVersion**
  - `id`, `environmentId`, `ciphertext`, `hash`, `createdAt`, `updatedByDeviceId`, `updatedByTokenId`.
- [ ] **AuditLog**
  - `id`, `userId`, `deviceId`, `envId`, `action`, `timestamp`.

---

### 3. Authentication & Session Management

- [ ] Implement **login** endpoint:
  - [ ] Accepts credentials or PAT.
  - [ ] Validates user.
  - [ ] Issues:
    - Short-lived **access token** (JWT or opaque).
    - Long-lived **refresh token**.
- [ ] Implement **refresh token** endpoint:
  - [ ] Validates refresh token (and device).
  - [ ] Issues new access token (and optionally rotates refresh token).
- [ ] Implement **personal access token** endpoints:
  - [ ] `POST /tokens` → create PAT for a logged-in user.
  - [ ] `GET /tokens` → list.
  - [ ] `DELETE /tokens/:id` or revoke.
- [ ] Implement **device registration**:
  - [ ] When extension logs in, register device with label and link to user.
  - [ ] Store `deviceId` and tie tokens to this device.

**Middleware:**

- [ ] `requireAccessToken` – validates access token, loads user + device into request context.
- [ ] Used on all protected env routes and dashboard routes.

---

### 4. Device Key Material Handling

- [ ] Decide key model (simple v1):
  - Generate a **per-user or per-device symmetric key** used to encrypt env blobs.
- [ ] Store key material:
  - Preferably in a secure secret store or encrypted at rest.
- [ ] Provide an endpoint to **deliver encrypted device key** to the extension:
  - e.g. part of login/refresh response or separate `/device/key` endpoint.
- [ ] Server should avoid exposing raw key where possible; if it does, enforce:
  - Only over HTTPS.
  - Only to authenticated devices.
  - Restrictable via device revocation.

> Note: this is where you decide how “zero-knowledge” vs “managed” you want to be. The more server knows about keys, the easier UX but weaker guarantees.

---

### 5. Environment & Snapshot API

#### 5.1 Initialization / Upsert

- [ ] `GET /envs/exists?repoId=<>&fileName=<>`
  - Returns whether env exists and its `envId` and metadata.
- [ ] `POST /envs`
  - Body:
    - `repoId`
    - `fileName`
    - `ciphertext`
    - `hash`
  - Behaviour:
    - If no Environment exists:
      - Create Environment row.
      - Create EnvVersion row.
    - Update Environment’s `latestHash` & `updatedAt`.

#### 5.2 Metadata for Polling

- [ ] `GET /envs/:envId/metadata`
  - Returns:
    - `envId`
    - `latestHash`
    - `updatedAt`
    - `lastUpdatedByDevice`
  - Used by extension to detect remote changes.

#### 5.3 Fetch Env Content

- [ ] `GET /envs/:envId`
  - Returns:
    - `ciphertext`
    - `hash`
    - `updatedAt`
    - Maybe `versions` if requested.

#### 5.4 Update Env

- [ ] `PUT /envs/:envId`
  - Body:
    - `ciphertext`
    - `hash`
    - Optional `baseHash` (for optimistic concurrency).
  - Behaviour:
    - If `baseHash` provided and differs from `latestHash`:
      - Optionally return a `409 Conflict` with metadata → client decides.
    - Else:
      - Create new EnvVersion.
      - Update Environment’s `latestH
