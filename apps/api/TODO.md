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

#### Core Schema (Better Auth)

- [ ] **User**
  - Table Name: `user`
  - Fields:
    - `id` (string, PK) - Unique identifier for each user
    - `name` (string) - User's chosen display name
    - `email` (string) - User's email address for communication and login
    - `emailVerified` (boolean) - Whether the user's email is verified
    - `image` (string, optional) - User's image url
    - `createdAt` (Date) - Timestamp of when the user account was created
    - `updatedAt` (Date) - Timestamp of the last update to the user's information

- [ ] **Session**
  - Table Name: `session`
  - Fields:
    - `id` (string, PK) - Unique identifier for each session
    - `userId` (string, FK) - The ID of the user
    - `token` (string) - The unique session token
    - `type` (string) - Session type: "extension", "web", "api", etc.
    - `expiresAt` (Date) - The time when the session expires
    - `ipAddress` (string, optional) - The IP address of the device
    - `userAgent` (string, optional) - The user agent information of the device
    - `createdAt` (Date) - Timestamp of when the session was created
    - `updatedAt` (Date) - Timestamp of when the session was updated

- [ ] **Account**
  - Table Name: `account`
  - Fields:
    - `id` (string, PK) - Unique identifier for each account
    - `userId` (string, FK) - The ID of the user
    - `accountId` (string) - The ID of the account as provided by the SSO or equal to userId for credential accounts
    - `providerId` (string) - The ID of the provider
    - `accessToken` (string, optional) - The access token of the account. Returned by the provider
    - `refreshToken` (string, optional) - The refresh token of the account. Returned by the provider
    - `accessTokenExpiresAt` (Date, optional) - The time when the access token expires
    - `refreshTokenExpiresAt` (Date, optional) - The time when the refresh token expires
    - `scope` (string, optional) - The scope of the account. Returned by the provider
    - `idToken` (string, optional) - The ID token returned from the provider
    - `password` (string, optional) - The password of the account. Mainly used for email and password authentication
    - `createdAt` (Date) - Timestamp of when the account was created
    - `updatedAt` (Date) - Timestamp of when the account was updated

- [ ] **Verification**
  - Table Name: `verification`
  - Fields:
    - `id` (string, PK) - Unique identifier for each verification
    - `identifier` (string) - The identifier for the verification request
    - `value` (string) - The value to be verified
    - `expiresAt` (Date) - The time when the verification request expires
    - `createdAt` (Date) - Timestamp of when the verification request was created
    - `updatedAt` (Date) - Timestamp of when the verification request was updated

#### Custom Tables

- [ ] **Device**
  - Table Name: `device`
  - Fields:
    - `id` (string, PK) - Unique identifier for each device
    - `userId` (string, FK) - The ID of the user
    - `name` (string) - Device name (e.g. "Rohit's Laptop")
    - `createdAt` (Date) - Timestamp of when the device was registered
    - `lastSeenAt` (Date) - Timestamp of when the device was last seen
    - `revoked` (boolean) - Whether the device has been revoked

- [ ] **PersonalAccessToken**
  - Table Name: `personalAccessToken`
  - Fields:
    - `id` (string, PK) - Unique identifier for each token
    - `userId` (string, FK) - The ID of the user
    - `label` (string) - Human-readable label for the token
    - `token` (string) - Hashed token value
    - `createdAt` (Date) - Timestamp of when the token was created
    - `lastUsedAt` (Date, optional) - Timestamp of when the token was last used
    - `revoked` (boolean) - Whether the token has been revoked

- [ ] **Environment**
  - Table Name: `environment`
  - Fields:
    - `id` (string, PK) - Unique identifier (envId)
    - `userId` (string, FK) - The ID of the user
    - `repoId` (string) - Repository identifier
    - `fileName` (string) - Environment file name
    - `latestHash` (string) - Hash of the latest version
    - `createdAt` (Date) - Timestamp of when the environment was created
    - `updatedAt` (Date) - Timestamp of when the environment was last updated

- [ ] **EnvVersion**
  - Table Name: `envVersion`
  - Fields:
    - `id` (string, PK) - Unique identifier for each version
    - `environmentId` (string, FK) - The ID of the environment
    - `ciphertext` (string) - Encrypted environment content
    - `hash` (string) - Hash of this version
    - `createdAt` (Date) - Timestamp of when the version was created
    - `updatedByDeviceId` (string, FK, optional) - The ID of the device that created this version
    - `updatedByTokenId` (string, FK, optional) - The ID of the token that created this version

- [ ] **AuditLog**
  - Table Name: `auditLog`
  - Fields:
    - `id` (string, PK) - Unique identifier for each log entry
    - `userId` (string, FK) - The ID of the user
    - `deviceId` (string, FK, optional) - The ID of the device
    - `envId` (string, FK, optional) - The ID of the environment
    - `action` (string) - Action performed
    - `timestamp` (Date) - Timestamp of when the action occurred

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
