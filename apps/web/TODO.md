# 🌐 EnvVault Web App

## About

The EnvVault web app is the **user-facing dashboard** and control plane:

- User authentication (login/signup).
- Management of **personal access tokens** and **devices**.
- Viewing **repos/envs**, versions & activity.
- (Optional) Web-based env editor using **client-side encryption**.
- Interfaces directly with the API, never storing plaintext secrets on its own.

---

## TODO – Web App (New Architecture)

### 1. Project Setup

- [ ] Initialize a Next.js (or similar) app.
- [ ] Configure:
  - API base URL
  - Auth provider (JWT via cookies or local storage, depending on design).
- [ ] Global layout and navigation:
  - Sidebar or header with:
    - Dashboard
    - Environments
    - Tokens
    - Devices
    - Account/Settings

---

### 2. Authentication UX

- [ ] Implement **login/signup** pages:
  - [ ] Calls API login endpoint.
  - [ ] Receives access + refresh tokens and/or a cookie-based session.
- [ ] Implement **session handling**:
  - [ ] Persist tokens (httpOnly cookies recommended).
  - [ ] Auto-refresh access token using refresh token when needed.
- [ ] Protect private routes:
  - [ ] Middleware / guards to redirect unauthenticated users to login.

---

### 3. Tokens Management UI

- [ ] Page: `/tokens`
  - [ ] List all personal access tokens:
    - Label
    - Created at
    - Last used at
    - Status (active/revoked)
  - [ ] “Create token” flow:
    - Label input.
    - POST to API to create token.
    - Show token **once** (for copy) with warning: “This token won’t be shown again.”
  - [ ] Revocation:
    - Button to revoke token (DELETE / update via API).

**Goal:** Easy way for users to generate a token for the extension.

---

### 4. Devices & Sessions UI

- [ ] Page: `/devices`
  - [ ] List all registered devices:
    - Name (e.g. “VS Code – Rohit Laptop”)
    - Last seen time
    - Status (active/revoked)
  - [ ] Show which tokens/sessions belong to which device.
  - [ ] Allow revoking a device:
    - Calls API to invalidate tokens for that device.

---

### 5. Environments Dashboard

- [ ] Page: `/dashboard` or `/envs`
  - [ ] List all environments (per repo+file):
    - Repo ID or friendly name
    - File name
    - Last updated time
    - Last updated by (device/token)
  - [ ] Filter by repo, search by file name.
  - [ ] Link to environment detail view.

- [ ] Environment detail page: `/envs/:envId`
  - [ ] Show:
    - Repo ID/name
    - File name
    - Latest metadata (updatedAt, latestHash)
  - [ ] Show version history:
    - List of versions with timestamp + device.
  - [ ] Controls:
    - (Optional) revert to an older version (sends instruction to API to set older version as latest).

---

### 6. Optional Web Env Editor (Client-side Encryption)

> Implement this only if you want users to edit `.env` values in the browser.

- [ ] On environment detail page:
  - [ ] “Edit” button that:
    - Fetches ciphertext + metadata.
- [ ] Implement client-side crypto logic:
  - [ ] Web app obtains key material **in some secure way** (similar to extension).
  - [ ] Decrypts ciphertext in browser memory.
  - [ ] Renders env as a list of key/value pairs for editing.
- [ ] On save:
  - [ ] Re-encrypt updated env into ciphertext.
  - [ ] Send to API update endpoint with new hash.

**Security note:**  
Web client must be treated like extension: no plaintext secrets sent back to API; encryption happens in browser.

---

### 7. Activity / Audit View

- [ ] Page: `/activity` or a section on the dashboard:
  - [ ] Show actions:
    - Env initialized.
    - Env updated (with device name).
    - Device added/revoked.
    - Token created/revoked.
  - [ ] Filters by env, device, date.

---

### 8. Docs & Onboarding

- [ ] Onboarding panel or `/getting-started`:
  - [ ] Steps:
    1. Sign up.
    2. Create a personal access token.
    3. Install VS Code extension.
    4. Paste token in extension.
    5. Initialize your first repo `.env`.
  - [ ] Short explanation of:
    - Token-based auth.
    - Local encryption in the extension.
    - How syncing works.

---

### 9. Integration With Extension Behaviour

- [ ] Ensure API endpoints used by extension match what web calls:
  - Env existence check.
  - Snapshot upload/update.
  - Metadata fetch.
  - Device & token management.
- [ ] When envs are updated via web:
  - [ ] API must update `latestHash` and `updatedAt` so polling in extension detects change.
- [ ] When devices/tokens are revoked via web:
  - [ ] API must prevent further env access with those tokens.

---

### 10. Testing & UX Polish

- [ ] Test flows:
  - Create token → use in extension → see device appear in `/devices`.
  - Initialize env via extension → see it show up in `/envs`.
  - Update env via extension → version appears in web history.
  - (If implemented) updateenv via web → extension sees new version via polling.
- [ ] Add friendly empty states:
  - No envs yet.
  - No devices yet.
  - No tokens yet.
- [ ] Add basic error states & messages:
  - 401 / 403 handling.
  - Network errors.

---
