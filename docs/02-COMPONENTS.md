# Remaining Gaps (02-COMPONENTS)

## P0 — Critical
*(None — offline, 403/409, conflict handling, workspace validation all done)*

## P1 — High
#	Item	Details
1	Personal Access Tokens	No schema, no endpoints, no UI — CLI/CI auth blocked
2	Audit log query API	Logs are written but no GET endpoints to read them
3	File size limits (extension)	No validation — can attempt to encrypt/upload arbitrarily large files
4	Server-side session revocation on logout	Client clears local secrets but doesn't revoke session on server
5	Redis caching	Redis exists but only used for rate limiting, no object/session caching
6	Environment editing (web)	Web dashboard is read-only — can view but not edit env variables

## P2 — Medium
#	Item	Details
7	Missing docs (03-07)	03-AUTHENTICATION.md through 07-IMPROVEMENTS.md referenced but don't exist
8	Automated tests	No unit, integration, or E2E tests anywhere
9	Version history UI	No revision tracking, rollback, or audit trail in web app
10	Refresh token endpoint	Delegated entirely to better-auth internals — no explicit rotation endpoint

## P3 — Nice to Have
#	Item	Details
11	Team/collaboration features	No sharing, invites, or role management
12	CLI tool	Not started
13	Email worker	Scaffolded but not functional
14	WebSocket real-time sync	Still polling only
15	Integrations page	UI exists, nothing wired

---

## Summary

Biggest remaining gaps: PAT system (CLI/CI auth), automated tests, audit log API, environment editing in web.