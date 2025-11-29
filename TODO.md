# 🧩 EnvVault VS Code Extension — Full TODO

This file lists **everything** needed to build the extension from zero → production, in small, actionable steps.

---

## 0. Project Setup & Basics

- [ ] **Create extension project**
  - [ ] Scaffold a new VS Code extension (TypeScript).
  - [ ] Confirm `src/extension.ts` (or `main.ts`) exists.
  - [ ] Ensure build works (`npm run compile` or equivalent).
  - [ ] Ensure debug launch works (F5 opens Extension Development Host).

- [ ] **Set extension metadata**
  - [ ] Update `package.json`:
    - [ ] `name`
    - [ ] `displayName`
    - [ ] `description`
    - [ ] `publisher`
    - [ ] `version`
    - [ ] `engines.vscode` (min VS Code version)
  - [ ] Add icon entry (optional, later).

- [ ] **Set activation events**
  - [ ] Activate on workspace open:
    - [ ] Add `"*"` or `"onStartupFinished"` (or a more specific event).
  - [ ] (Optional) Activate on specific commands:
    - [ ] `onCommand:envvault.openStatus`
    - [ ] `onCommand:envvault.reauthenticate`

- [ ] **Add extension commands (for dev & debug)**
  - [ ] In `contributes.commands`:
    - [ ] `envvault.openStatus` → open a status/info view.
    - [ ] `envvault.reauthenticate` → manually re-run auth flow.
    - [ ] `envvault.forceSync` → manually force a sync (debug only, optional).
    - [ ] `envvault.showLogs` → show debug logs (optional).

---

## 1. Configuration & Settings

- [ ] **Define user settings in `package.json`**
  - [ ] `envvault.apiBaseUrl` (string)
    - [ ] Default to `http://localhost:3000` for dev.
  - [ ] `envvault.sync.pollIntervalSeconds` (number)
    - [ ] Default 60–120 seconds.
  - [ ] `envvault.logging.verbose` (boolean)
    - [ ] Default `false`.

- [ ] **Create config helper module**
  - [ ] Add a small helper to read VS Code configuration:
    - [ ] Get API base URL.
    - [ ] Get poll interval.
    - [ ] Get logging flag.
  - [ ] Ensure config can be refreshed when user changes settings.

---

## 2. UI Foundation (Status Bar, Notifications, Output Channel)

### 2.1 Status Bar

- [ ] **Create a status bar item on activation**
  - [ ] Position on right side.
  - [ ] Initial text: `EnvVault: 🔴`
  - [ ] Tooltip: `EnvVault: Not authenticated`.

- [ ] **Define status states**
  - [ ] Unauthenticated (🔴)
  - [ ] Authenticated but not initialized (🟡)
  - [ ] Synced / idle (🟢)
  - [ ] Syncing (🔁)
  - [ ] Error (⚠️)

- [ ] **Implement a small UI manager**
  - [ ] Functions to:
    - [ ] Set auth state (update icon + tooltip).
    - [ ] Set sync state (e.g. “Syncing…”, “Synced at 12:30”).
    - [ ] Attach click handler:
      - [ ] On click, open a quick pick with:
        - [ ] “View EnvVault Status”
        - [ ] “Re-authenticate”
        - [ ] “Open Logs”

### 2.2 Notifications

- [ ] **Define key notification types**
  - [ ] Info:
    - [ ] Welcome message (first install).
    - [ ] Env initialized successfully.
    - [ ] Env synced.
  - [ ] Warning:
    - [ ] No `.env` found.
    - [ ] Network issues (cannot reach API).
  - [ ] Error:
    - [ ] Token invalid / expired.
    - [ ] Failed to encrypt/decrypt.
    - [ ] Failed to sync.

- [ ] **Plan where to show them**
  - [ ] After failed auth.
  - [ ] After first-time env initialization.
  - [ ] On conflict detection.
  - [ ] On repeated errors (but avoid spam).

### 2.3 Logging / Output Channel

- [ ] **Create `EnvVault` output channel**
  - [ ] Used for debug logs, not visible to normal users unless opened.
- [ ] **Logging helper**
  - [ ] `logInfo(message)` – writes to output channel if verbose logging enabled.
  - [ ] `logError(message, error)` – writes detailed errors for debugging.
  - [ ] `logDebug(message)` – only when `envvault.logging.verbose` is `true`.

---

## 3. Secure Storage (Tokens & Keys)

- [ ] **Define secrets to store**
  - [ ] `envvault.accessToken`
  - [ ] `envvault.refreshToken`
  - [ ] `envvault.deviceId`
  - [ ] `envvault.encryptionKey` or `envvault.keyMaterial` (derived key or wrapped key).

- [ ] **Implement secure storage manager**
  - [ ] Helper functions:
    - [ ] `getAccessToken()`
    - [ ] `setAccessToken(token)`
    - [ ] `getRefreshToken()`
    - [ ] `setRefreshToken(token)`
    - [ ] `getDeviceId()`
    - [ ] `setDeviceId(id)`
    - [ ] `getEncryptionKey()`
    - [ ] `setEncryptionKey(key)`
    - [ ] `clearAll()` – clear all secrets on forced logout.

---

## 4. Authentication & Device Registration Flow (Extension Side)

### 4.1 First-Time Auth UX

- [ ] **On activation, check auth state**
  - [ ] Try reading `accessToken` and `refreshToken` from SecretStorage.
  - [ ] If none found → mark as unauthenticated (🔴).

- [ ] **Show welcome/auth prompt**
  - [ ] If unauthenticated:
    - [ ] Show a notification:
      - Message: “EnvVault: Connect your account to sync `.env` files.”
      - Buttons:
        - “Paste Token”
        - “Open Docs” (optional)
    - [ ] On “Paste Token”:
      - [ ] Show an input box asking for **Personal Access Token** generated on web.

- [ ] **Call API: login with token**
  - [ ] Use `apiBaseUrl` and call `/auth/login-with-token`.
  - [ ] On success:
    - [ ] Receive:
      - Access token
      - Refresh token
      - Device ID
      - Device key material (if your API returns it)
    - [ ] Store tokens + deviceId in SecretStorage.
    - [ ] Derive/store encryption key from key material.
    - [ ] Update status bar → `EnvVault: 🟡` (authenticated, repo not yet initialized).
  - [ ] On failure:
    - [ ] Show error notification: “Invalid token.”
    - [ ] Log detailed error to output channel.

### 4.2 Token Refresh Handling

- [ ] **Implement API client wrapper**
  - [ ] All network calls go through a single helper that:
    - [ ] Attaches access token in headers.
    - [ ] Detects 401 / token expired response.
    - [ ] Automatically tries refresh flow.

- [ ] **Refresh flow**
  - [ ] If API returns 401 or access token known expired:
    - [ ] Call `/auth/refresh` with refresh token.
    - [ ] On success:
      - [ ] Update access (and possibly refresh) token in SecretStorage.
      - [ ] Retry original request.
    - [ ] On failure:
      - [ ] Clear tokens and encryption key.
      - [ ] Update status bar to 🔴.
      - [ ] Show notification: “EnvVault: Login expired. Please reconnect.”

---

## 5. Encryption Key Handling (Device Key Material)

- [ ] **Decide on key material format with API**
  - [ ] E.g. `deviceKey` or `wrappedUserKey`.

- [ ] **Derive usable encryption key**
  - [ ] From the device key material (details depend on your crypto spec).
  - [ ] Store the derived key securely:
    - [ ] Only the symmetric key needed for AES-GCM.

- [ ] **Implement crypto helpers (conceptually)**
  - [ ] `encryptEnv(plaintextEnvString) -> { ciphertextBase64, ivBase64 }`
  - [ ] `decryptEnv(ciphertextBase64, ivBase64) -> plaintextEnvString`
  - [ ] `hashEnv(plaintextEnvString) -> hashHexString` (SHA-256).

- [ ] **Ensure all encryption/decryption is done client-side**
  - [ ] Never send plaintext env to server.

---

## 6. Repo & Env Identification Logic

- [ ] **Workspace detection**
  - [ ] Get active workspace folder path.
  - [ ] Handle case: no workspace open → show error and skip.

- [ ] **Read git remote**
  - [ ] Try run `git remote get-url origin` from workspace path.
  - [ ] If not available:
    - [ ] Use only workspace path for repo identity.
    - [ ] Log a warning: “No git remote, using folder path.”

- [ ] **Compute `repoId`**
  - [ ] Combine remote URL + workspace path + maybe user ID.
  - [ ] Hash into a stable hex string.

- [ ] **Compute `envId`**
  - [ ] For `.env` file:
    - [ ] `envId = hash(repoId + ".env")`.

- [ ] **Local metadata store**
  - [ ] Decide location:
    - Option A: `.envvault.meta.json` at workspace root:
      - Pros: transparent on disk.
      - Cons: extra file in repo (add to `.gitignore`).
    - Option B: VS Code `workspaceState`.
  - [ ] Metadata per env:
    - `envId`
    - `fileName` (".env")
    - `lastSyncedHash`
    - `lastSyncedAt` (timestamp string).

- [ ] **Implement helpers**
  - [ ] `loadEnvMetadata(envId)` → metadata or default.
  - [ ] `saveEnvMetadata(envId, data)`.

---

## 7. Environment Initialization Flow (First Time per Repo)

### 7.1 Detect whether env exists on server

- [ ] On extension activation:
  - [ ] After auth & repo detection, check if `.env` exists locally:
    - [ ] If not → do nothing yet, but keep track.

- [ ] When `.env` is created or opened:
  - [ ] Compute `repoId` and `envId`.
  - [ ] Call API: `GET /envs/exists?repoId=&fileName=.env`.
  - [ ] Check response:
    - [ ] If `exists = false` → show init prompt.
    - [ ] If `exists = true` → run initial sync (see below).

### 7.2 Init prompt UI

- [ ] Show a dialog:
  - Title: “Initialize EnvVault for this project?”
  - Message: “Do you want EnvVault to securely back up and sync this `.env` across your devices?”
  - Buttons:
    - “Initialize”
    - “Not now”

- [ ] If user clicks **Initialize**:
  - [ ] Read `.env` file content.
  - [ ] If empty:
    - [ ] Confirm with user or show info: “.env file is empty. Initialize anyway?”
  - [ ] Encrypt content with device key.
  - [ ] Compute hash of plaintext.
  - [ ] Call `POST /envs` with:
    - `repoId`
    - `fileName`
    - `ciphertext`
    - `hash`
  - [ ] On success:
    - [ ] Save `lastSyncedHash = hash`.
    - [ ] Save `lastSyncedAt = now`.
    - [ ] Update status bar to `EnvVault: 🟢 Synced`.
    - [ ] Notify: “EnvVault: `.env` is now backed up and synced.”

---

## 8. Initial Sync When Env Already Exists

- [ ] If `exists = true` from `/envs/exists`:
  - [ ] Fetch metadata from `GET /envs/:envId/metadata`.
  - [ ] Optionally fetch full ciphertext via `GET /envs/:envId`.

- [ ] Read local `.env` if present:
  - [ ] If no local `.env`:
    - [ ] Offer to restore from remote:
      - “A remote `.env` exists for this repo. Restore it locally?”
      - Buttons: “Restore” / “Skip”.
  - [ ] If local `.env` present:
    - [ ] Decrypt remote ciphertext.
    - [ ] Compute `hashRemote` and `hashLocal`.
    - [ ] Compare:
      - [ ] If `hashLocal == hashRemote`:
        - [ ] Mark as synced and set `lastSyncedHash = hashLocal`.
      - [ ] If one of them empty / very small:
        - [ ] Offer to pick the non-empty one as source.
      - [ ] If both non-empty and differ:
        - [ ] Show conflict prompt (first-time conflict):
          - Buttons:
            - “Use Local `.env` and overwrite remote”
            - “Use Remote `.env` and overwrite local”
        - [ ] Apply chosen version and set `lastSyncedHash`.

---

## 9. Local Change Detection & Auto Sync (Push)

### 9.1 Watch `.env` file

- [ ] Register a watcher for `.env`:
  - [ ] On file open: keep reference.
  - [ ] On file save: trigger sync check.

### 9.2 On save sync flow

- [ ] When `.env` is saved:
  - [ ] Read current `.env` content.
  - [ ] If file not found → skip.
  - [ ] Compute `hashLocal`.
  - [ ] Load `lastSyncedHash` from metadata.
  - [ ] If `hashLocal == lastSyncedHash`:
    - [ ] Do nothing.
  - [ ] Else:
    - [ ] Encrypt `.env` using device key.
    - [ ] Call `PUT /envs/:envId` with `ciphertext` + `hashLocal`.
    - [ ] On success:
      - [ ] Update `lastSyncedHash = hashLocal`.
      - [ ] Update `lastSyncedAt`.
      - [ ] Update status bar: “Synced at HH:MM”.
    - [ ] On failure:
      - [ ] Show error notification: “EnvVault: Failed to sync `.env`.”
      - [ ] Log details.

### 9.3 Optional: Debounce changes before save

- [ ] Optionally track text changes & auto sync without save:
  - [ ] Set up a debounce timer (e.g. 3–5 seconds after last edit) before pushing.
  - [ ] Only do this if it doesn’t feel annoying.

---

## 10. Background Polling & Remote Sync (Pull)

### 10.1 Polling loop

- [ ] On activation:
  - [ ] Start an interval timer (dur = `envvault.sync.pollIntervalSeconds`).
  - [ ] On each tick:
    - [ ] For each known `envId`:
      - [ ] Call `GET /envs/:envId/metadata`.
      - [ ] Compare `remoteHash` vs `lastSyncedHash`.

### 10.2 Auto-pull when safe

- [ ] If `remoteHash == lastSyncedHash`:
  - [ ] No remote changes → skip.

- [ ] If `remoteHash != lastSyncedHash`:
  - [ ] Read local `.env`, compute `hashLocal`.
  - [ ] If `hashLocal == lastSyncedHash`:
    - [ ] Local is unchanged since last sync:
      - [ ] Safe to auto-pull:
        - [ ] `GET /envs/:envId` to get ciphertext.
        - [ ] Decrypt to plaintext.
        - [ ] Overwrite local `.env`.
        - [ ] Update `lastSyncedHash = remoteHash`.
        - [ ] Notify:
          - [ ] “EnvVault: `.env` updated from remote changes.”
          - (Optional: show which device updated it.)

---

## 11. Conflict Detection & Resolution UI

- [ ] If `remoteHash != lastSyncedHash` **and** `hashLocal != lastSyncedHash`:
  - [ ] Both local and remote changed since last sync → conflict.

- [ ] Show conflict UI:
  - [ ] Message:  
    `EnvVault: Conflict detected between local and remote ".env".`
  - [ ] Buttons:
    - [ ] “Keep Local (.env)”
    - [ ] “Use Remote (.env)”
    - [ ] (Later) “View Diff”

- [ ] If user selects **Keep Local**:
  - [ ] Encrypt local `.env`.
  - [ ] Push to server (`PUT /envs/:envId`).
  - [ ] Set `lastSyncedHash = hashLocal`.

- [ ] If user selects **Use Remote**:
  - [ ] Fetch remote ciphertext.
  - [ ] Decrypt.
  - [ ] Overwrite local `.env`.
  - [ ] Set `lastSyncedHash = remoteHash`.

- [ ] Show final notification:
  - [ ] “EnvVault: Conflict resolved using Local/Remote.”

---

## 12. Extension Settings UI & Commands UX

- [ ] **`EnvVault: Open Status` command**
  - [ ] Show a simple info popup:
    - [ ] Auth state (user account/email if available).
    - [ ] Current repo sync state.
    - [ ] Last sync time.
    - [ ] Number of envs tracked.

- [ ] **`EnvVault: Re-authenticate` command**
  - [ ] Clear tokens from SecretStorage (or ask).
  - [ ] Re-run login flow (paste PAT).
  - [ ] Keep metadata but warn: “You will need to re-sync.”

- [ ] **Settings UI**
  - [ ] Users can adjust:
    - [ ] API URL (for dev/stage/prod).
    - [ ] Poll interval.
    - [ ] Verbose logging.
  - [ ] React to change events:
    - [ ] If poll interval changes, restart timer.
    - [ ] If API URL changes, future requests use new URL.

---

## 13. Error Handling, Edge Cases & Polish

- [ ] **No workspace open**
  - [ ] Show message:
    - [ ] “EnvVault: No workspace open. Open a project folder to use EnvVault.”

- [ ] **.env missing**
  - [ ] On init attempt:
    - [ ] Show warning: “No .env file found in this workspace.”
  - [ ] Optionally provide a button:
    - [ ] “Create .env and initialize”.

- [ ] **API unreachable**
  - [ ] On network error:
    - [ ] Show non-blocking warning:
      - [ ] “EnvVault: Unable to reach server. Will retry automatically.”
    - [ ] Retry on next save/poll.

- [ ] **Device revoked from web**
  - [ ] If API starts returning:
    - [ ] `403 Forbidden` or `401` with “device revoked” code:
      - [ ] Clear tokens.
      - [ ] Status: `🔴`.
      - [ ] Notification: “EnvVault: This device has been revoked. Please reconnect or contact your admin.”

- [ ] **Large `.env` files**
  - [ ] Decide a max size threshold.
  - [ ] If > threshold:
    - [ ] Warn user: “Large .env file, sync may be slower.”
    - [ ] Allow them to continue or disable sync for this file.

---

## 14. Testing, Debugging, and Packaging

- [ ] **Manual testing scenarios**
  - [ ] First-time installation & auth.
  - [ ] First repo init.
  - [ ] Edit `.env` and check it syncs.
  - [ ] Clone same repo on another machine, login, confirm restore.
  - [ ] Remote change (simulate via web) and see extension pull update.
  - [ ] Conflicting changes from two machines → conflict prompt.

- [ ] **Debugging tools**
  - [ ] Ensure output channel logs enough details.
  - [ ] Add a hidden or debug-only command:
    - [ ] “EnvVault: Dump Debug State” to show:
      - [ ] RepoId
      - [ ] envId
      - [ ] lastSyncedHash
      - [ ] timestamps
      - [ ] auth state (without showing tokens)

- [ ] **Packaging**
  - [ ] Define `vsce` packaging config or use `npm run package`.
  - [ ] Validate extension manifest.
  - [ ] Prepare Marketplace listing (later).

---

## 15. Nice-to-Haves (Future)

- [ ] Support multiple env files (`.env.local`, `.env.production`, etc.).
- [ ] Show inline hints in the editor (e.g. “EnvVault: synced” in status bar when editing).
- [ ] Command to show quick diff preview before overwriting `.env`.
- [ ] Integration tests (using VS Code’s testing API).
- [ ] Telemetry (opt-in) to measure usage (no secret content).

---
