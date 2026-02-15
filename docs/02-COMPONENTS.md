Items Previously Flagged as Missing — Now DONE
Item	Doc Said	Actual Status
Key material storage	"Generates new each time"	DONE — Stored encrypted per-user with envelope encryption (AES-256-GCM + master key)
Web RSA keypair generation	"Not implemented"	DONE — Full RSA-OAEP 2048 via Web Crypto API + IndexedDB storage
Key material wrapping for devices	"Incomplete"	DONE — Server wraps with device public key, one-time delivery flag
Key derivation uses deviceId	"Breaks cross-device sync"	FIXED — Now uses userId as salt (PBKDF2, 100k iterations)
Rate limiting	"Not implemented"	DONE — 6 tiers via Upstash Redis (global, api, auth, mutation, sensitive, email)
Web device registration	"Not implemented"	DONE — use-device-key-material-registration hook + use-key-material-sync
Secure cleanup on logout	"Not done"	DONE — Clears all 6 secret storage entries + cancels polling
Key material sync (web)	Missing	DONE — Auto-syncs on login, registers device if needed
What's ACTUALLY Still Missing
P0 — Critical
#	Item	Details
1	Offline/network handling (extension)	No ConnectionMonitor, no OfflineQueue, no "Offline" status bar state. Has retry logic but no graceful degradation
2	Env conflict detection (API)	latestHash field exists but PUT /envs/:envId doesn't validate baseHash against it — no 409 Conflict response
3	403 Forbidden handling (extension)	No handling for revoked devices — will fail silently
4	409 Conflict handling (extension)	No conflict-specific UI or resolution flow
P1 — High
#	Item	Details
5	Personal Access Tokens	No schema, no endpoints, no UI — CLI/CI auth blocked
6	Audit log query API	Logs are written but no GET endpoints to read them
7	Workspace validation (extension)	No MAX_FILES limit, no unsafe path detection, no multi-root workspace support
8	File size limits (extension)	No validation — can attempt to encrypt/upload arbitrarily large files
9	Server-side session revocation on logout	Client clears local secrets but doesn't revoke session on server
10	Redis caching	Redis exists but only used for rate limiting, no object/session caching
11	Environment editing (web)	Web dashboard is read-only — can view but not edit env variables
P2 — Medium
#	Item	Details
12	Missing docs (03-07)	03-AUTHENTICATION.md through 07-IMPROVEMENTS.md referenced but don't exist
13	Marketplace assets (extension)	No icon, no README, no CHANGELOG, no LICENSE, no privacy policy
14	Automated tests	No unit, integration, or E2E tests anywhere
15	Version history UI	No revision tracking, rollback, or audit trail in web app
16	Refresh token endpoint	Delegated entirely to better-auth internals — no explicit rotation endpoint
P3 — Nice to Have
#	Item	Details
17	Team/collaboration features	No sharing, invites, or role management
18	CLI tool	Not started
19	Email worker	Scaffolded but not functional
20	WebSocket real-time sync	Still polling only
21	Integrations page	UI exists, nothing wired
Updated Summary
The docs are outdated — the core encryption/key material system is actually working correctly now. The biggest remaining gaps are:

Offline resilience in the extension (no graceful degradation)
Conflict detection on the API (field exists, logic doesn't)
PAT system (blocks CLI/CI usage)
No tests at all
Marketplace prep (icon, docs, license)
The app is much closer to production than the docs suggest. The core value prop (encrypted cross-device env sync) works end-to-end.