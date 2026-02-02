# 🧩 EnvVault VS Code Extension — Full TODO

This file lists **everything** needed to build the extension from zero → production, in small, actionable steps.

---

## 0. Project Setup & Basics

- [ ] **Create extension project**
  - [X] Scaffold a new VS Code extension (TypeScript).
  - [X] Confirm `src/extension.ts` (or `main.ts`) exists.
  - [X] Ensure build works (`npm run compile` or equivalent).
  - [X] Ensure debug launch works (F5 opens Extension Development Host).

- [ ] **Set extension metadata**
  - [X] Update `package.json`:
  - [X] `name`
    - [X] `displayName`
    - [X] `description`
    - [X] `publisher`
    - [X] `version`
    - [X] `engines.vscode` (min VS Code version)
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

- [X] **Define user settings in `package.json`**
  - [X] `envvault.apiBaseUrl` (string)
    - [X] Default to `http://localhost:3000` for dev.
  - [X] `envvault.sync.pollIntervalSeconds` (number)
    - [X] Default 60–120 seconds.
  - [X] `envvault.logging.verbose` (boolean)
    - [X] Default `false`.

- [X] **Create config helper module**
  - [X] Add a small helper to read VS Code configuration:
    - [X] Get API base URL.
    - [X] Get poll interval.
    - [X] Get logging flag.
  - [X] Ensure config can be refreshed when user changes settings.

---

## 2. UI Foundation (Status Bar, Notifications, Output Channel)

### 2.1 Status Bar

- [X] **Create a status bar item on activation**
  - [X] Position on right side.
  - [X] Initial text: `EnvVault: 🔴`
  - [X] Tooltip: `EnvVault: Not authenticated`.

- [X] **Define status states**
  - [X] Unauthenticated (🔴)
  - [X] Authenticated but not initialized (🟡)
  - [X] Synced / idle (🟢)
  - [X] Syncing (🔁)
  - [X] Error (⚠️)

- [X] **Implement a small UI manager**
  - [X] Functions to:
    - [X] Set auth state (update icon + tooltip).
    - [X] Set sync state (e.g. “Syncing…”, “Synced at 12:30”).
    - [X] Attach click handler:
      - [X] On click, open a quick pick with:
        - [X] “View EnvVault Status”
        - [X] “Re-authenticate”
        - [X] “Open Logs”

### 2.2 Notifications

- [X] **Define key notification types**
  - [X] Info:
    - [X] Welcome message (first install).
    - [X] Env initialized successfully.
    - [X] Env synced.
  - [X] Warning:
    - [X] No `.env` found.
    - [X] Network issues (cannot reach API).
  - [X] Error:
    - [X] Token invalid / expired.
    - [X] Failed to encrypt/decrypt.
    - [X] Failed to sync.

- [X] **Plan where to show them**
  - [X] After failed auth.
  - [X] After first-time env initialization.
  - [X] On conflict detection.
  - [X] On repeated errors (but avoid spam).

### 2.3 Logging / Output Channel

- [X] **Create `EnvVault` output channel**
  - [X] Used for debug logs, not visible to normal users unless opened.
- [X] **Logging helper**
  - [X] `logInfo(message)` – writes to output channel if verbose logging enabled.
  - [X] `logError(message, error)` – writes detailed errors for debugging.
  - [X] `logDebug(message)` – only when `envvault.logging.verbose` is `true`.

---

## 3. Secure Storage (Tokens & Keys)

- [X] **Define secrets to store**
  - [X] `envvault.accessToken`
  - [X] `envvault.refreshToken`
  - [X] `envvault.deviceId`
  - [X] `envvault.encryptionKey` or `envvault.keyMaterial` (derived key or wrapped key).

- [X] **Implement secure storage manager**
  - [X] Helper functions:
    - [X] `getAccessToken()`
    - [X] `setAccessToken(token)`
    - [X] `getRefreshToken()`
    - [X] `setRefreshToken(token)`
    - [X] `getDeviceId()`
    - [X] `setDeviceId(id)`
    - [X] `getEncryptionKey()`
    - [X] `setEncryptionKey(key)`
    - [X] `clearAll()` – clear all secrets on forced logout.

---

## 4. Authentication & Device Registration Flow (Extension Side)

### 4.1 First-Time Auth UX

- [X] **On activation, check auth state**
  - [X] Try reading `accessToken` and `refreshToken` from SecretStorage.
  - [X] If none found → mark as unauthenticated (🔴).

- [X] **Show welcome/auth prompt**
  - [X] If unauthenticated:
    - [X] Show a login window (WebView).
    - [X] On “Sign In”:
      - [X] Initiate device code flow.

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

- [X] **Decide on key material format with API**
  - [X] E.g. `deviceKey` or `wrappedUserKey`.

- [X] **Derive usable encryption key**
  - [X] From the device key material (details depend on your crypto spec).
  - [X] Store the derived key securely:
    - [X] Only the symmetric key needed for AES-GCM.

- [X] **Implement crypto helpers (conceptually)**
  - [X] `encryptEnv(plaintextEnvString) -> { ciphertextBase64, ivBase64 }`
  - [X] `decryptEnv(ciphertextBase64, ivBase64) -> plaintextEnvString`
  - [X] `hashEnv(plaintextEnvString) -> hashHexString` (SHA-256).

- [X] **Ensure all encryption/decryption is done client-side**
  - [X] Never send plaintext env to server.

---

## 6. Repo & Env Identification Logic

- [X] **Workspace detection**
  - [X] Get active workspace folder path.
  - [X] Handle case: no workspace open → show error and skip.

- [X] **Read git remote**
  - [X] Try run `git remote get-url origin` from workspace path.
  - [X] If not available:
    - [X] Use only workspace path for repo identity.
    - [X] Log a warning: “No git remote, using folder path.”

- [X] **Compute `repoId`**
  - [X] Combine remote URL + workspace path + maybe user ID.
  - [X] Hash into a stable hex string.

- [X] **Compute `envId`**
  - [X] For `.env` file:
    - [X] `envId = hash(repoId + ".env")`.

- [X] **Local metadata store**
  - [X] Decide location:
    - Option A: `.envvault.meta.json` at workspace root:
      - Pros: transparent on disk.
      - Cons: extra file in repo (add to `.gitignore`).
    - Option B: VS Code `workspaceState`.
  - [X] Metadata per env:
    - `envId`
    - `fileName` (".env")
    - `lastSyncedHash`
    - `lastSyncedAt` (timestamp string).

- [X] **Implement helpers**
  - [X] `loadEnvMetadata(envId)` → metadata or default.
  - [X] `saveEnvMetadata(envId, data)`.

---

## 7. Environment Initialization Flow (First Time per Repo)

### 7.1 Detect whether env exists on server

- [X] On extension activation:
  - [X] After auth & repo detection, check if `.env` exists locally:
    - [X] If not → do nothing yet, but keep track.

- [X] When `.env` is created or opened:
  - [X] Compute `repoId` and `envId`.
  - [X] Call API: `GET /envs/exists?repoId=&fileName=.env`.
  - [X] Check response:
    - [X] If `exists = false` → show init prompt.
    - [X] If `exists = true` → run initial sync (see below).

### 7.2 Init prompt UI

- [X] Show a dialog:
  - Title: “Initialize EnvVault for this project?”
  - Message: “Do you want EnvVault to securely back up and sync this `.env` across your devices?”
  - Buttons:
    - “Initialize”
    - “Not now”

- [X] If user clicks **Initialize**:
  - [X] Read `.env` file content.
  - [X] If empty:
    - [X] Confirm with user or show info: “.env file is empty. Initialize anyway?”
  - [X] Encrypt content with device key.
  - [X] Compute hash of plaintext.
  - [X] Call `POST /envs` with:
    - `repoId`
    - `fileName`
    - `ciphertext`
    - `hash`
  - [X] On success:
    - [X] Save `lastSyncedHash = hash`.
    - [X] Save `lastSyncedAt = now`.
    - [X] Update status bar to `EnvVault: 🟢 Synced`.
    - [X] Notify: “EnvVault: `.env` is now backed up and synced.”

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

- [X] Register a watcher for `.env`:
  - [X] On file open: keep reference.
  - [X] On file save: trigger sync check.

### 9.2 On save sync flow

- [X] When `.env` is saved:
  - [X] Read current `.env` content.
  - [X] If file not found → skip.
  - [X] Compute `hashLocal`.
  - [X] Load `lastSyncedHash` from metadata.
  - [X] If `hashLocal == lastSyncedHash`:
    - [X] Do nothing.
  - [X] Else:
    - [X] Encrypt `.env` using device key.
    - [X] Call `PUT /envs/:envId` with `ciphertext` + `hashLocal`.
    - [X] On success:
      - [X] Update `lastSyncedHash = hashLocal`.
      - [X] Update `lastSyncedAt`.
      - [X] Update status bar: “Synced at HH:MM”.
    - [X] On failure:
      - [X] Show error notification: “EnvVault: Failed to sync `.env`.”
      - [X] Log details.

### 9.3 Optional: Debounce changes before save

- [X] Optionally track text changes & auto sync without save:
  - [X] Set up a debounce timer (e.g. 3–5 seconds after last edit) before pushing.
  - [X] Only do this if it doesn’t feel annoying.

---

## 10. Background Polling & Remote Sync (Pull)

### 10.1 Polling loop

- [X] On activation:
  - [X] Start an interval timer (dur = `envvault.sync.pollIntervalSeconds`).
  - [X] On each tick:
    - [X] For each known `envId`:
      - [X] Call `GET /envs/:envId/metadata`.
      - [X] Compare `remoteHash` vs `lastSyncedHash`.

### 10.2 Auto-pull when safe

- [X] If `remoteHash == lastSyncedHash`:
  - [X] No remote changes → skip.

- [X] If `remoteHash != lastSyncedHash`:
  - [X] Read local `.env`, compute `hashLocal`.
  - [X] If `hashLocal == lastSyncedHash`:
    - [X] Local is unchanged since last sync:
      - [X] Safe to auto-pull:
        - [X] `GET /envs/:envId` to get ciphertext.
        - [X] Decrypt to plaintext.
        - [X] Overwrite local `.env`.
        - [X] Update `lastSyncedHash = remoteHash`.
        - [X] Notify:
          - [X] “EnvVault: `.env` updated from remote changes.”
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
