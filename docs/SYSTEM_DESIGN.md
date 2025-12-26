# EnvVault System Design

## Overview

EnvVault is a zero-knowledge environment variable management system that provides end-to-end encryption for `.env` files with cross-device synchronization. The system consists of three main components: a web dashboard, a VS Code extension, and a backend API server.

### Core Principles

- **Zero-Knowledge Architecture**: Server never sees plaintext environment variables
- **Cross-Device Sync**: Same user can access encrypted envs from multiple devices
- **Device Isolation**: Each device has its own wrapped copy of encryption keys
- **End-to-End Encryption**: Client encrypts before upload, decrypts after download

---

## Table of Contents

1. [System Architecture](./01-ARCHITECTURE.md)
   - High-level system overview
   - Component interactions
   - Technology stack

2. [Components](./02-COMPONENTS.md)
   - Web Application
   - VS Code Extension
   - API Server
   - Shared Packages

3. [Authentication Flows](./03-AUTHENTICATION.md)
   - Web App Authentication
   - Extension Device Authorization
   - Session Management

4. [Encryption System](./04-ENCRYPTION.md)
   - Key Material Architecture
   - Encryption Flow
   - Decryption Flow
   - Key Derivation

5. [Sync Mechanisms](./05-SYNC.md)
   - Environment File Detection
   - Initialization Flow
   - Change Detection
   - Conflict Resolution

6. [Known Issues & TODOs](./06-ISSUES.md)
   - Current Limitations
   - Incomplete Features
   - Technical Debt

7. [Proposed Improvements](./07-IMPROVEMENTS.md)
   - Security Enhancements
   - Feature Additions
   - Architecture Refinements

---

## Quick Start for Developers

### Prerequisites

- Node.js 18+
- Bun 1.2.8+ (workspace package manager)
- PostgreSQL database
- VS Code 1.106+ (for extension development)

### Key Environment Variables

- `KEY_MATERIAL_MASTER_KEY`: 32-byte hex string for server-side key material encryption
- `DATABASE_URL`: PostgreSQL connection string
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: OAuth credentials
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`: OAuth credentials

### Running the System

```bash
# Install dependencies
bun install

# Run all services in development
bun run dev

# Run specific service
bunx turbo dev --filter=web
bunx turbo dev --filter=api
bunx turbo dev --filter=extension#watch
```

---

## System Status

**Current State**: Active development, core features implemented but incomplete

**Production Readiness**: Not ready - see [Known Issues](./06-ISSUES.md) for details

**Key Missing Features**:

- Proper key material storage and retrieval
- Web app device registration with RSA keypair
- Complete environment CRUD operations
- Version history and rollback
- Key rotation mechanism

---

## Architecture Diagrams

See [System Architecture](./01-ARCHITECTURE.md) for detailed diagrams including:

- Component interaction flow
- Authentication sequence diagrams
- Encryption/decryption flow
- Sync mechanism flow
