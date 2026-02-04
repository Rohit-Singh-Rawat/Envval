# 🚀 EnvVault Extension - Production Readiness Checklist

> **Status**: Preparing for VS Code Marketplace Release  
> **Last Updated**: 2026-02-04

This document tracks everything needed to make EnvVault production-ready and publishable to the VS Code Marketplace.

---

## 📦 Marketplace Readiness (Required for Publishing)

### Publishing Requirements
- [ ] **Extension Metadata** (package.json)
  - [x] Name, display name, description
  - [x] Publisher ID verified
  - [x] Version number follows semver
  - [ ] Add proper icon (PNG, 128x128 recommended)
  - [ ] Add extension banner color
  - [ ] Add categories (Security, Other)
  - [ ] Add keywords for search (env, environment, secrets, sync)
  - [ ] Set repository URL in package.json
  - [ ] Set homepage/bugs/license URLs

- [ ] **README.md** (marketplace listing)
  - [ ] Clear description of what extension does
  - [ ] Feature list with screenshots/GIFs
  - [ ] Installation instructions
  - [ ] Usage guide (how to get started)
  - [ ] Requirements (workspace, Git, etc.)
  - [ ] Security information (encryption, privacy)
  - [ ] Troubleshooting section
  - [ ] Links to documentation

- [ ] **CHANGELOG.md**
  - [ ] Version history with release notes
  - [ ] Follow "Keep a Changelog" format

- [ ] **LICENSE**
  - [ ] Add appropriate license file
  - [ ] Update package.json license field

- [ ] **Privacy & Security Documentation**
  - [ ] Privacy policy (how data is handled)
  - [ ] Security documentation (encryption method)
  - [ ] Terms of service

- [ ] **Publisher Account Setup**
  - [ ] Create publisher account on VS Code Marketplace
  - [ ] Verify publisher identity
  - [ ] Set up Personal Access Token (PAT) for publishing

---

## 🔴 CRITICAL ISSUES (Must Fix Before Release)

### 1. Offline/Network Handling
**Priority: CRITICAL** | **Research: ✅ Complete** | **Status: ⚠️ Not Implemented**

- [ ] **Connection Status Detection**
  - [ ] Create `ConnectionMonitor` service
  - [ ] Implement health check endpoint ping
  - [ ] Detect online/offline transitions
  - [ ] Update context variables: `envval:offline`

- [ ] **Status Bar Indicators**
  - [ ] Show connection status in status bar
  - [ ] Online: `🟢 EnvVault`
  - [ ] Offline: `⚪ EnvVault (Offline)`
  - [ ] Connecting: `🔄 EnvVault (Connecting...)`
  - [ ] Click to retry connection when offline

- [ ] **Graceful Degradation**
  - [ ] Allow viewing .env files when offline
  - [ ] Show "offline" badge on cached data in tree view
  - [ ] Queue sync operations for when connection returns
  - [ ] Don't spam error notifications when offline

- [ ] **Operation Queue**
  - [ ] Create `OfflineQueue` service
  - [ ] Queue push/pull operations when offline
  - [ ] Auto-execute queue when back online
  - [ ] Show notification: "Queued for sync when online"

- [ ] **Smart Polling**
  - [ ] Stop polling when offline (save resources)
  - [ ] Resume polling when online
  - [ ] Adjust poll frequency based on connection quality
  - [ ] Add backoff on repeated failures

- [ ] **User Notifications**
  - [ ] Non-intrusive "gone offline" notification
  - [ ] "Back online, syncing..." notification
  - [ ] Don't spam - use debouncing (5s minimum)
  - [ ] Clear offline-related messages when online

---

### 2. Workspace Context Handling
**Priority: CRITICAL** | **Research: ✅ Complete** | **Status: ⚠️ Partially Implemented**

- [ ] **Workspace Validation**
  - [ ] Add `validateWorkspace()` function
  - [ ] Check if workspace folder is open
  - [ ] Detect "unsafe" paths (Desktop, Documents, C:\, etc.)
  - [ ] Warn users opening broad folders
  - [ ] Provide "Open Project Folder" action button

- [ ] **Performance & Safety Limits**
  - [ ] Add `MAX_FILES = 10000` limit to `getAllEnvFiles()`
  - [ ] Add `MAX_DEPTH = 10` limit to prevent infinite recursion
  - [ ] Track scannedFiles counter
  - [ ] Show warning when hitting limits
  - [ ] Log performance metrics

- [ ] **Single File Mode Support**
  - [ ] Detect when single .env file is opened
  - [ ] Use file's directory as temporary workspace
  - [ ] Show prompt: "Track this .env file?"
  - [ ] Provide "Open Folder" alternative

- [ ] **Multi-Root Workspace Support**
  - [ ] Update `getWorkspacePath()` to handle multi-root
  - [ ] Show workspace folder picker when multiple folders
  - [ ] Use active editor's folder if available
  - [ ] Add "Switch Workspace Folder" command
  - [ ] Show which folder is being tracked in UI

- [ ] **Contextual Welcome Messages**
  - [ ] Show different messages based on context
  - [ ] No workspace: "Open Folder" button
  - [ ] Unauthenticated: "Sign In" button
  - [ ] Empty workspace: "Create .env" / "Import" buttons
  - [ ] Use `when` clauses in viewsWelcome

- [ ] **Status Context Indicators**
  - [ ] Show workspace info in status bar tooltip
  - [ ] Indicate multi-root workspace tracking
  - [ ] Add breadcrumb to tree view header

---

### 3. Enhanced Tree View & Control Panel
**Priority: HIGH** | **Research: ✅ Complete** | **Status: ⚠️ Needs Enhancement**

#### Phase 1: Enhanced Tree View (Essential)

- [ ] **Control Panel Section**
  - [ ] Create `SectionHeaderItem` class
  - [ ] Create `ActionButtonItem` class
  - [ ] Add "🎛️ CONTROL PANEL" section to tree
  - [ ] Add "⬆️ Push All Changes" button
  - [ ] Add "⬇️ Pull All Updates" button
  - [ ] Add "➕ Create New .env" button
  - [ ] Add "🔄 Force Sync All" button
  - [ ] Add "⚙️ Settings" button

- [ ] **Repository Info Section**
  - [ ] Create `RepoInfoItem` class
  - [ ] Add "📦 REPOSITORY" section
  - [ ] Show repo name/ID (truncated)
  - [ ] Show git remote URL
  - [ ] Show connection status (🟢 Connected / 🔴 Offline)
  - [ ] Show last sync time
  - [ ] Add "Switch Repository" button (multi-root)

- [ ] **Statistics Section**
  - [ ] Create `StatItem` class
  - [ ] Add "📊 STATISTICS" section
  - [ ] Show "Files tracked" count
  - [ ] Show "Modified" count
  - [ ] Show "Variables encrypted" total count

- [ ] **Enhanced Env Items**
  - [ ] Keep existing status icons (✅ synced, ✏️ modified, etc.)
  - [ ] Add inline action buttons (push, pull)
  - [ ] Improve tooltips with more details
  - [ ] Add accessibility labels

- [ ] **Rich Context Menus**
  - [ ] Add "Push" action for modified files
  - [ ] Add "Pull" action for all files
  - [ ] Add "Ignore" action
  - [ ] Add "Delete" action (with confirmation)
  - [ ] Add "Copy Env ID" for debugging
  - [ ] Add "View Diff" (future)
  - [ ] Group actions logically (1_sync, 2_manage, 3_clipboard)

- [ ] **New Commands**
  - [ ] Implement `envval.pushAll`
  - [ ] Implement `envval.pullAll`
  - [ ] Implement `envval.createEnv`
  - [ ] Implement `envval.deleteEnv`
  - [ ] Implement `envval.ignoreEnv`
  - [ ] Implement `envval.copyEnvId`
  - [ ] Implement `envval.switchRepository`
  - [ ] Implement `envval.openSettings`

#### Phase 2: Optional Webview Panel (Advanced)

- [ ] **Conflict Resolution Webview**
  - [ ] Create `ConflictResolverPanel` class
  - [ ] Side-by-side diff view (local vs remote)
  - [ ] "Use Local" / "Use Remote" buttons
  - [ ] Syntax highlighted preview
  - [ ] Show variable count differences

- [ ] **Settings Management UI**
  - [ ] Custom settings editor (instead of JSON)
  - [ ] Connection settings (API URL, poll interval)
  - [ ] Privacy settings (logging, telemetry)
  - [ ] Advanced settings (encryption, debugging)

- [ ] **Sync History Timeline**
  - [ ] Visual timeline of sync events
  - [ ] Show which device made changes
  - [ ] Show timestamps and change summaries
  - [ ] Rollback capability (future)

---

## ⚠️ HIGH Priority Issues

### Error Handling & Edge Cases

- [ ] **Improved Error Messages**
  - [ ] Replace generic errors with actionable messages
  - [ ] Include "what went wrong" and "how to fix"
  - [ ] Add error codes for debugging
  - [ ] Log full stack traces to output channel

- [ ] **Network Error Handling**
  - [ ] Distinguish timeout vs connection refused vs DNS failure
  - [ ] Show different messages for different error types
  - [ ] Don't retry non-retryable errors (400, 404, etc.)
  - [ ] Add circuit breaker pattern for repeated failures

- [ ] **API Error Handling**
  - [ ] Handle 401 Unauthorized (token expired)
  - [ ] Handle 403 Forbidden (device revoked)
  - [ ] Handle 409 Conflict (concurrent edits)
  - [ ] Handle 429 Rate Limit
  - [ ] Handle 500s gracefully with retry

- [ ] **Crypto Error Handling**
  - [ ] Detect corrupted encryption keys
  - [ ] Handle decryption failures gracefully
  - [ ] Show clear message: "Cannot decrypt - key may be invalid"
  - [ ] Provide recovery options

- [ ] **Large File Handling**
  - [ ] Set max .env file size (e.g., 1MB)
  - [ ] Warn before syncing large files
  - [ ] Show progress for large uploads
  - [ ] Handle timeouts on large files

---

### Security & Performance

- [ ] **Input Validation**
  - [ ] Validate all API responses
  - [ ] Sanitize file paths
  - [ ] Validate env IDs before using
  - [ ] Check for null/undefined before operations

- [ ] **Memory Management**
  - [ ] Don't load entire .env into memory repeatedly
  - [ ] Clear crypto buffers after use
  - [ ] Dispose of watchers properly
  - [ ] Use streaming for large files

- [ ] **Rate Limiting**
  - [ ] Add client-side rate limiting
  - [ ] Debounce rapid file changes before sync
  - [ ] Don't spam API on every keystroke
  - [ ] Implement exponential backoff

- [ ] **Secure Cleanup**
  - [ ] Clear secrets on logout
  - [ ] Clear cached plaintext
  - [ ] Dispose of encryption keys properly
  - [ ] Zero out sensitive memory

---

## 📝 Medium Priority

### UX Improvements

- [x] Status bar showing sync status
- [x] Tree view with tracked environments
- [ ] Better onboarding (first-use tutorial)
- [ ] Keyboard shortcuts for common actions
- [ ] Quick actions from command palette
- [ ] Hover tooltips on env variables (in code)
- [ ] Inline sync status in editor

### Features

- [x] Multiple .env file support (.env.local, .env.production)
- [ ] Bulk operations (sync all, ignore all)
- [ ] Export/import .env files
- [ ] Team collaboration features
- [ ] Env variable search across files
- [ ] Git integration (respect .gitignore)
- [ ] Conflict resolution with merge

### Documentation

- [ ] In-extension help documentation
- [ ] Video tutorials
- [ ] FAQ section
- [ ] Migration guide (from other tools)
- [ ] API documentation for developers
- [ ] Security whitepaper

---

## 🧪 Testing & Quality

### Testing
- [ ] **Manual Test Scenarios**
  - [ ] First-time installation & auth flow
  - [ ] First repo initialization
  - [ ] Edit .env and verify sync
  - [ ] Multi-device sync (simulate with 2 VS Code instances)
  - [ ] Conflict resolution flow
  - [ ] Offline mode handling
  - [ ] Large workspace scanning (1000+ files)
  - [ ] Multi-root workspace
  - [ ] Single file mode

- [ ] **Automated Tests**
  - [ ] Unit tests for crypto functions
  - [ ] Unit tests for repo detection
  - [ ] Unit tests for sync logic
  - [ ] Integration tests with mock API
  - [ ] E2E tests (VS Code extension testing API)

- [ ] **Edge Cases**
  - [ ] No workspace open
  - [ ] Empty .env file
  - [ ] Corrupted .env file
  - [ ] Git remote changed
  - [ ] Workspace renamed/moved
  - [ ] Network disconnected mid-sync
  - [ ] Multiple .env files with same name (subdirectories)

### Code Quality
- [ ] TypeScript strict mode enabled
- [ ] All linter warnings fixed
- [ ] No `any` types remaining
- [ ] Proper error types (no `unknown` catches)
- [ ] Code documentation (JSDoc)
- [ ] Remove debug console.log statements
- [ ] Remove commented-out code

---

## 🎨 Polish & Nice-to-Haves

- [ ] Extension icon design
- [ ] Marketing materials (screenshots, GIFs)
- [ ] VS Code theme integration (respect user's theme)
- [ ] Accessibility improvements (screen reader support)
- [ ] Localization (i18n) support
- [ ] Telemetry (opt-in, privacy-respecting)
- [ ] Performance metrics
- [ ] Extension bundle size optimization
- [ ] Startup performance optimization

---

## ✅ COMPLETED ITEMS

### Core Foundation
- [x] Extension project scaffolding
- [x] TypeScript build setup
- [x] Debug launch configuration
- [x] Package.json metadata (name, publisher, version)
- [x] Activation events (`*`)
- [x] Configuration schema (API URL, poll interval, logging)
- [x] Config helper module

### Authentication
- [x] Device code OAuth flow (WebView)
- [x] Token storage (SecretStorage API)
- [x] Access token + refresh token handling
- [x] Auto refresh on 401
- [x] Logout flow
- [x] Session state management

### Encryption & Crypto
- [x] Device key material handling
- [x] AES-GCM encryption/decryption
- [x] SHA-256 hashing
- [x] Client-side only crypto (no plaintext to server)
- [x] Key derivation from device key

### Repo & Env Detection
- [x] Workspace detection
- [x] Git remote detection (origin, upstream, any)
- [x] Submodule detection
- [x] Worktree detection
- [x] Content-based repo ID (fallback)
- [x] Stable repo ID computation
- [x] Env ID computation (hash of repoId + fileName)
- [x] Monorepo detection
- [x] Migration detection & prompts

### Metadata & Storage
- [x] Local metadata store (workspace state)
- [x] `loadEnvMetadata()`, `saveEnvMetadata()`
- [x] Track `lastSyncedHash`, `lastSyncedAt`
- [x] Repo identity store
- [x] Git remote history tracking

### Sync Logic
- [x] Environment initialization flow
- [x] Init prompt UI (dialog)
- [x] Empty file confirmation
- [x] Initial sync when env exists remotely
- [x] Restore prompt UI
- [x] First-time sync conflict resolution
- [x] Local change detection (file watcher)
- [x] On-save sync (push)
- [x] Background polling (pull)
- [x] Auto-pull when safe (no local changes)
- [x] Three-way reconciliation logic
- [x] Zombie metadata detection & cleanup

### UI Components
- [x] Status bar item with states (🔴 🟡 🟢 🔁 ⚠️)
- [x] Output channel for logging
- [x] Login window (WebView)
- [x] Tree view provider (tracked environments)
- [x] Folder grouping in tree view
- [x] Status icons (synced, modified, conflict, ignored)
- [x] Context menus (Sync Now, Open File)
- [x] Welcome views (sign in, no envs)
- [x] Notification dialogs (info, warning, error)

### Commands
- [x] `envval.showQuickSyncAction`
- [x] `envval.forceSync`
- [x] `envval.showLogs`
- [x] `envval.logout`
- [x] `envval.viewRepoIdentity`
- [x] `envval.setManualRepoIdentity`
- [x] `envval.setSubProjectPath`
- [x] `envval.resetRepoIdentity`
- [x] `envval.migrateRepoIdentity`
- [x] `envval.diagnoseRepoDetection`
- [x] `envval.refreshTrackedEnvs`
- [x] `envval.pushEnv`
- [x] `envval.openFile`

### API Integration
- [x] API client wrapper with retry logic
- [x] Exponential backoff (1s → 10s)
- [x] Retryable error codes (408, 429, 500-504)
- [x] Network error detection (ETIMEDOUT, ECONNREFUSED, etc.)
- [x] Auth interceptor (attach bearer token)
- [x] 401 detection & token refresh
- [x] Structured API error types
- [x] Type-safe API responses
- [x] All endpoints implemented (repos, envs, auth)

### Features
- [x] Multiple .env file support
- [x] Hover provider (show env var values in code)
- [x] Sensitive value masking (KEY, SECRET, PASSWORD, TOKEN)
- [x] Env cache service
- [x] Status calculator (synced/modified/conflict/ignored)
- [x] Debounced file watching

---

## 📋 Quick Reference: Implementation Priority

**Week 1 - Critical Fixes:**
1. ✅ Offline/network handling (connection monitor, queue, status)
2. ✅ Workspace validation (unsafe paths, limits, single file)
3. ✅ Enhanced tree view (control panel, repo info, statistics)

**Week 2 - Important Features:**
4. Rich context menus & inline actions
5. Better error messages & handling
6. Multi-root workspace support
7. Performance optimizations

**Week 3 - Marketplace Prep:**
8. README, CHANGELOG, LICENSE
9. Icon & marketing materials
10. Testing & bug fixes
11. Documentation

**Week 4 - Final Polish:**
12. Code cleanup & optimization
13. Security review
14. Final testing
15. Publish to marketplace 🚀

---

## Research Documents

- [Offline/Slow Internet Handling](../.gemini/antigravity/brain/86237dd7-559d-44ec-bd4f-772e91a5668f/offline-internet-research.md) ✅
- [Workspace Context Handling](../.gemini/antigravity/brain/86237dd7-559d-44ec-bd4f-772e91a5668f/workspace-context-research.md) ✅
- [Control Panel & View Enhancement](../.gemini/antigravity/brain/86237dd7-559d-44ec-bd4f-772e91a5668f/control-panel-research.md) ✅

---

**Next Actions:**
1. Start with offline handling implementation
2. Add workspace validation
3. Enhance tree view with control panel
4. Prepare marketplace assets
