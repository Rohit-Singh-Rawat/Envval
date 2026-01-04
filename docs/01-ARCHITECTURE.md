# System Architecture

## High-Level Overview

EnvVault follows a client-server architecture with three main client surfaces and a centralized API server. All environment variable data is encrypted client-side before transmission, ensuring the server never has access to plaintext secrets.

```mermaid
graph TB
    subgraph "Clients"
        WEB[Web Dashboard<br/>React + TanStack Router]
        EXT[VS Code Extension<br/>TypeScript + VS Code API]
        CLI[CLI Tool<br/>Future Implementation]
    end

    subgraph "API Server"
        API[Hono API Server<br/>Node.js + TypeScript]
        AUTH[Better Auth<br/>Authentication Service]
        DB[(PostgreSQL<br/>Database)]
    end

    subgraph "Shared Packages"
        DB_PKG[Database Schema<br/>Drizzle ORM]
        UI_PKG[UI Components<br/>React Components]
        EMAIL[Email Service<br/>Resend Integration]
    end

    WEB -->|HTTPS| API
    EXT -->|HTTPS| API
    CLI -.->|HTTPS| API

    API --> AUTH
    API --> DB
    API --> EMAIL

    WEB --> UI_PKG
    API --> DB_PKG
    EXT --> DB_PKG
```

## Component Interaction Flow

```mermaid
sequenceDiagram
    participant User
    participant Web as Web App
    participant Ext as Extension
    participant API as API Server
    participant DB as Database

    Note over User,DB: User Registration Flow
    User->>Web: Sign up (Email/Google/GitHub)
    Web->>API: POST /auth/sign-up
    API->>DB: Create user record
    API->>DB: Generate & encrypt keyMaterial
    API-->>Web: Session cookie + user data

    Note over User,DB: Extension Login Flow
    User->>Ext: Initiate login
    Ext->>API: POST /auth/device/code
    API->>DB: Create deviceCode record
    API-->>Ext: userCode (e.g., "ABC-123")
    Ext->>User: Display userCode
    User->>Web: Enter userCode
    Web->>API: Approve device
    API->>DB: Update deviceCode status
    Ext->>API: Poll for token
    API->>DB: Create device + session
    API->>DB: Get user keyMaterial
    API-->>Ext: JWT + deviceId + keyMaterial

    Note over User,DB: Environment Sync Flow
    User->>Ext: Edit .env file
    Ext->>Ext: Encrypt with keyMaterial
    Ext->>API: PUT /envs/:id (encrypted)
    API->>DB: Store encrypted content
    Ext->>API: Poll for changes
    API->>DB: Check latestHash
    API-->>Ext: Updated content (if changed)
    Ext->>Ext: Decrypt & update file
```

## Technology Stack

### Web Application (`apps/web`)

- **Framework**: React 19 with TanStack Router
- **State Management**: TanStack Query (React Query)
- **Authentication**: Better Auth (React client)
- **Styling**: Custom CSS with design system
- **Build Tool**: Vite

### VS Code Extension (`apps/extension`)

- **Language**: TypeScript
- **Runtime**: Node.js (VS Code extension host)
- **Storage**: VS Code SecretStorage API + local JSON files
- **Build Tool**: esbuild
- **File Watching**: VS Code FileSystemWatcher API

### API Server (`apps/api`)

- **Framework**: Hono (lightweight web framework)
- **Authentication**: Better Auth (server)
- **Database**: PostgreSQL with Drizzle ORM
- **Email**: Resend (via shared email package)
- **Runtime**: Node.js

### Shared Packages

- **`packages/db`**: Drizzle ORM schema and migrations
- **`packages/ui`**: Shared React components (Button, Card, Code)
- **`packages/email`**: Email service abstraction (Resend provider)
- **`packages/queue`**: Background job queue (Redis-based)
- **`packages/typescript-config`**: Shared TypeScript configurations

## Data Flow Architecture

### Request Flow

```mermaid
graph LR
    A[Client Request] --> B{Authentication<br/>Required?}
    B -->|Yes| C[Validate Session/JWT]
    B -->|No| D[Process Request]
    C -->|Valid| D
    C -->|Invalid| E[401 Unauthorized]
    D --> F{Encryption<br/>Operation?}
    F -->|Encrypt| G[Client-side Encryption]
    F -->|Decrypt| H[Client-side Decryption]
    F -->|Neither| I[Standard Operation]
    G --> J[Store Encrypted Blob]
    H --> K[Return Encrypted Blob]
    I --> L[Database Operation]
    J --> L
    K --> M[Client Decrypts]
    L --> N[Response]
    M --> N
```

### Encryption Flow

```mermaid
graph TB
    A[Plaintext .env] --> B[Get keyMaterial]
    B --> C[Derive AES Key<br/>PBKDF2]
    C --> D[Generate Random IV]
    D --> E[AES-256-GCM Encrypt]
    E --> F[Format: ciphertext.authTag:iv]
    F --> G[Calculate SHA-256 Hash]
    G --> H[Upload to Server]
    H --> I[Server Stores<br/>Encrypted Blob]
```

## Network Architecture

### API Endpoints Structure

```
/api
├── /auth
│   ├── /session          # Session management
│   ├── /extension        # Extension-specific auth
│   └── /device           # Device authorization
└── /v1
    ├── /onboarding       # User onboarding
    ├── /repos            # Repository management
    └── /envs             # Environment CRUD (planned)
```

### Authentication Methods

- **Web App**: Cookie-based sessions (Better Auth)
- **Extension**: JWT tokens (15-minute expiry)
- **Device Authorization**: OAuth 2.0 Device Flow (RFC 8628)

## Security Architecture

### Key Hierarchy

```mermaid
graph TD
    A[Server Master Key<br/>KEY_MATERIAL_MASTER_KEY] --> B[User KeyMaterial<br/>Encrypted at Rest]
    B --> C[Device Wrapped Key<br/>RSA-OAEP Encrypted]
    C --> D[Device Private Key<br/>Local Storage Only]
    B --> E[AES-256 Key<br/>PBKDF2 Derived]
    E --> F[Environment Content<br/>AES-256-GCM Encrypted]
```

### Threat Model

| Threat               | Mitigation                                          |
| -------------------- | --------------------------------------------------- |
| Server DB breach     | KeyMaterial encrypted at rest (envelope encryption) |
| Network interception | HTTPS + wrapped keyMaterial (RSA-OAEP)              |
| Device compromise    | Device revocation; other devices unaffected         |
| Replay attacks       | JWT expiry (15min) + session validation             |
| Man-in-the-middle    | HTTPS + certificate pinning (optional)              |
| KeyMaterial leak     | Rotate master key; re-encrypt all user keyMaterials |

## Deployment Architecture

### Development

- All services run locally
- Shared PostgreSQL database
- Hot reload enabled for all services

### Production (Planned)

- Web app: Static hosting (Vercel/Netlify)
- API server: Node.js runtime (Railway/Fly.io)
- Database: Managed PostgreSQL
- Extension: VS Code Marketplace

## Scalability Considerations

### Current Limitations

- Single database instance
- No caching layer
- Synchronous encryption operations
- No rate limiting

### Future Improvements

- Redis caching for sessions
- Background job queue for heavy operations
- CDN for static assets
- Database read replicas
- Rate limiting middleware



