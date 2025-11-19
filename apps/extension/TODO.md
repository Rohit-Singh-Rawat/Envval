# 🧩 EnvVault VS Code Extension

## About

The EnvVault VS Code extension automatically **syncs `.env` files per repo** with a secure backend:

- **No extra passwords / master key prompts** – just log in with your EnvVault account or personal token.
- Uses **access + refresh tokens** for authentication.
- Each device receives **device-specific key material** to encrypt/decrypt envs **locally**.
- Server only sees **ciphertext** + metadata (hashes, timestamps).
- Extension handles **repo detection, initialization, auto-sync, conflict detection**, and shows clear UX (status bar, notifications).

---

## TODO – Extension (New Architecture)

### 1. Project Setup & Basic UX

- [ ] Initialize VS Code extension project (TypeScript).
- [ ] Configure `package.json`:
  - [ ] Extension name, description, publisher.
  - [ ] Activation events (on workspace open).
  - [ ] Configuration options:
    - `envvault.apiBaseUrl`
    - `envvault.environment` (dev/stage/prod if needed)
- [ ] Add a **status bar item**:
  - Shows auth + sync state (e.g. `EnvVault: 🔴 / 🟡 / 🟢 / ⚠️`).

---

### 2. Authentication & Tokens (Access + Refresh)

- [ ] Implement **first-time auth** flow:
  - Option A (simpler to start): user pastes a **personal access token** generated from web app.
  - Option B (later): open browser to sign-in and then receive a device token.
- [ ] On auth success:
  - [ ] Call API to exchange token for **access token + refresh token + device ID + device key material (or pointer)**.
  - [ ] Securely store:
    - Access token
    - Refresh token
    - Device ID
    - Encrypted device key material if needed
- [ ] Implement **token refresh**:
  - [ ] Background flow that uses refresh token to get a new access token before expiry.
  - [ ] Handle failure (expired/invalid refresh token) → clear tokens, prompt re-login.
- [ ] Always attach access token to API requests (Authorization header).

**Goal:** The dev logs in once per device, and from then on the extension stays authenticated via refresh tokens.

---

### 3. Device Key Material & Encryption Key

- [ ] On first successful auth:
  - [ ] Receive **device key material** from API (e.g., `deviceKey` or encrypted `envKeyEnvelope`).
- [ ] Derive or unwrap a **symmetric encryption key** on the extension:
  - [ ] This key is used to encrypt/decrypt env blobs for that user/device.
- [ ] Store derived key (or encrypted form) securely using:
  - [ ] VS Code `SecretStorage` / OS secure storage.
- [ ] Use a strong encryption scheme on the client:
  - [ ] AES-GCM for authenticated encryption.
  - [ ] Random IV/nonce per encryption.
- [ ] Never log plaintext envs or keys.

**Goal:** Encryption/decryption is always local, powered by device key material, with zero extra prompts.

---

### 4. Repo & Environment Identification

- [ ] On extension activation:
  - [ ] Detect current workspace root.
  - [ ] Read git remote URL (if available).
  - [ ] Compute a stable `repoId` from (remote URL + workspace path).
- [ ] Per env file (`.env` initially):
  - [ ] Compute an `envId` (e.g. hash of `repoId + fileName`).
- [ ] Maintain **local metadata** per env:
  - [ ] `lastSyncedHash` – hash of last synced plaintext or normalized text.
  - [ ] `lastSyncedAt` – timestamp.
- [ ] Store metadata in:
  - [ ] A small `.envvault.meta.json` in workspace OR
  - [ ] VS Code workspace/global state.

---

### 5. Environment Initialization Flow (First Time per Repo)

- [ ] On workspace open or when `.env` is opened:
  - [ ] Ensure auth & device key ready.
  - [ ] Compute `repoId` + `envId`.
  - [ ] Call API to **check if env exists** for this repo+file.
- [ ] If env **does NOT exist**:
  - [ ] Prompt: “Initialize EnvVault for this `.env`?”.
  - [ ] On confirm:
    - [ ] Read local `.env` contents.
    - [ ] Encrypt with device key.
    - [ ] Send to API as initial snapshot.
    - [ ] Compute and store `lastSyncedHash` & `lastSyncedAt`.
    - [ ] Update status bar to “Synced”.
- [ ] If env **exists**:
  - [ ] Fetch metadata + ciphertext.
  - [ ] Decrypt remote blob.
  - [ ] Compare with local `.env`:
    - If local missing/empty → offer to restore remote.
    - If remote empty → push local as source.
    - If both differ → prompt which side to keep (simple conflict flow).
  - [ ] Once resolved, set `lastSyncedHash` baseline.

---

### 6. Local Changes → Auto Sync (Push Path)

- [ ] Subscribe to `.env` events:
  - [ ] `onDidOpenTextDocument`
  - [ ] `onDidSaveTextDocument`
  - [ ] Optionally `onDidChangeTextDocument` for debounce.
- [ ] On save/change of `.env`:
  - [ ] Read new `.env` contents.
  - [ ] Compute `hashLocal`.
  - [ ] Compare against `lastSyncedHash`:
    - If same → do nothing.
    - If different:
      - [ ] Encrypt with device key.
      - [ ] Send updated ciphertext to API.
      - [ ] On success: update `lastSyncedHash` & `lastSyncedAt`.
      - [ ] Update status bar to “Synced ✅”.

**Goal:** Dev edits `.env` as usual; extension quietly syncs securely in the background.

---

### 7. Background Polling → Remote Changes (Pull Path)

- [ ] Start a **background polling loop** on activation (e.g. every 60–120 seconds).
- [ ] For each tracked `envId`:
  - [ ] Call API to fetch **metadata only**:
    - `remoteHash`
    - `remoteUpdatedAt`
  - [ ] Compare:
    - If `remoteHash == lastSyncedHash` → no remote changes.
    - Else:
      - [ ] Read local `.env`, compute `hashLocal`.
      - [ ] If `hashLocal == lastSyncedHash` → local is clean.
        - [ ] Safe to auto-pull:
          - Fetch ciphertext.
          - Decrypt.
          - Overwrite `.env`.
          - Set `lastSyncedHash = remoteHash`.
          - Small notification: “EnvVault: Updated `.env` from remote.”
      - [ ] If `hashLocal != lastSyncedHash` → both changed → conflict.

---

### 8. Conflict Handling (Local vs Remote)

- [ ] When both local & remote changed:
  - [ ] Show a conflict prompt:
    - “EnvVault: Local and remote `.env` differ. Which version should win?”
    - Options:
      - `Keep Local (push to server)`
      - `Use Remote (overwrite local)`
      - (Later) `Open Diff`
- [ ] If `Keep Local`:
  - [ ] Encrypt local `.env`, push to server.
  - [ ] Update `lastSyncedHash = hashLocal`.
- [ ] If `Use Remote`:
  - [ ] Fetch, decrypt, overwrite `.env`.
  - [ ] Update `lastSyncedHash = remoteHash`.
- [ ] Update status bar accordingly.

---

### 9. UX, Errors & Settings

- [ ] Status bar states:
  - 🔴 Not authenticated / token invalid.
  - 🟡 Authenticated but env not initialized.
  - 🟢 Synced.
  - 🔁 Syncing.
  - ⚠️ Error.
- [ ] Notifications for:
  - Missing/invalid tokens.
  - First-time repo initialization.
  - Major sync events.
  - Conflicts.
- [ ] Error handling:
  - Network/API errors → non-blocking warning, retries.
  - Invalid tokens → clear tokens, prompt re-login.
- [ ] Settings page:
  - API base URL.
  - Polling interval.
  - Toggle verbose logging.

---
