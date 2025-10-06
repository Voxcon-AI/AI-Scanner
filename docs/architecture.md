# ai.scanner Fullstack Architecture Document

**Version:** 1.0
**Date:** 2025-10-03
**Author:** Winston (Architect)
**Project:** ai.scanner - AI-Powered Document Routing System

---

## Introduction

This document outlines the complete fullstack architecture for ai.scanner, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

### Starter Template or Existing Project

**N/A - Greenfield project**

This is a net-new greenfield implementation with no existing codebase constraints. All technology selections are made fresh based on PRD requirements for optimal MVP delivery. No starter templates are being used—the monorepo structure and service architecture are custom-designed for the specific requirements of AI-powered document routing with file system integration.

### Change Log

| Date       | Version | Description                   | Author              |
| ---------- | ------- | ----------------------------- | ------------------- |
| 2025-10-03 | 1.0     | Initial architecture document | Winston (Architect) |

---

## High Level Architecture

### Technical Summary

ai.scanner implements a **containerized microservices architecture** deployed via Docker Compose, combining Node.js backend services with a lightweight vanilla JavaScript frontend. The system uses **event-driven asynchronous processing** with a Redis-backed queue to handle document ingestion from file system polling through AI analysis to user approval workflows. Backend services (file watcher, analysis worker, API, email service) communicate via PostgreSQL database and Redis pub/sub, while the **Express.js REST API** serves as the integration point for the browser-based review interface. Infrastructure runs on Docker containers orchestrated locally or on Linux/Windows/macOS hosts with mounted network folders for document access. This architecture achieves the PRD's goals of <15 second processing time through parallel worker processing, 90% time savings via AI-powered routing recommendations, and cross-platform deployment via containerization.

### Platform and Infrastructure Choice

**Platform:** Docker Compose on self-hosted infrastructure (Linux/Windows/macOS)

**Key Services:**

- **Container Orchestration:** Docker Compose (v2.0+)
- **Database:** PostgreSQL 16 (persistent storage for document metadata, user auth, queue state)
- **Queue/Cache:** Redis 7 (BullMQ Lite job queue, session caching, rate limiting)
- **AI Service:** Google Gemini 1.5 Flash API (external, REST-based)
- **Email Delivery:** User-configured SMTP relay (Gmail, SendGrid, AWS SES, or local server)
- **File Storage:** Host file system (network shares mounted as Docker volumes—NFS for Linux, SMB/CIFS for Windows)

**Deployment Host and Regions:** Self-hosted on-premises or cloud VMs (AWS EC2, Azure VM, DigitalOcean Droplet). Single-region deployment typical (primary user location). No CDN required for MVP (web UI served from same host as API).

**Rationale:** Docker Compose chosen over Kubernetes for simplicity—single-command deployment, minimal operational overhead, suitable for small-medium deployments (<100 docs/day). Self-hosted approach aligns with compliance requirements (sensitive documents stay on-premises) and avoids recurring cloud costs for file storage. PostgreSQL provides ACID guarantees for document state tracking. Redis chosen over RabbitMQ/Kafka for lightweight queue implementation with <5ms latency.

### Repository Structure

**Structure:** Monorepo with npm workspaces

**Monorepo Tool:** npm workspaces (native to Node.js, no additional tooling required)

**Package Organization:**

```
ai.scanner/
├── services/               # Backend service packages
│   ├── watcher/           # File system polling service
│   ├── worker/            # AI analysis worker
│   ├── api/               # Express REST API
│   └── mailer/            # Email notification service
├── frontend/              # Web UI (static assets)
├── shared/                # Shared TypeScript types, utilities
├── docker/                # Docker Compose configs
├── docs/                  # Documentation
├── examples/              # Sample data sources
└── package.json           # Root workspace config
```

**Rationale:** Monorepo enables code sharing (TypeScript interfaces between frontend/backend), unified versioning (single package.json for all services), and simplified dependency management. npm workspaces chosen over Nx/Turborepo to minimize tooling complexity—no build orchestration needed for simple Node.js services. Each service is independently deployable Docker container but shares development workspace.

### High Level Architecture Diagram

```mermaid
graph TB
    subgraph "User Environment"
        Scanner[Document Scanner]
        Email[Email Client]
        Browser[Web Browser]
    end

    subgraph "Host File System"
        ScanFolder[/mnt/scan-folder]
        OutputFolders[/mnt/output-folders]
    end

    subgraph "Docker Compose Cluster"
        subgraph "Backend Services"
            Watcher[File Watcher Service<br/>Node.js]
            Worker[Analysis Worker<br/>Node.js]
            API[Express API<br/>Node.js]
            Mailer[Email Service<br/>Node.js]
        end

        subgraph "Data Layer"
            Postgres[(PostgreSQL<br/>Document Metadata)]
            Redis[(Redis<br/>Queue + Cache)]
        end

        Frontend[Static Web UI<br/>Vanilla JS]
    end

    subgraph "External Services"
        Gemini[Google Gemini API<br/>Vision Analysis]
        SMTP[SMTP Server<br/>Email Delivery]
    end

    Scanner -->|Saves files| ScanFolder
    ScanFolder -->|Volume mount| Watcher
    Watcher -->|Queue job| Redis
    Watcher -->|Store metadata| Postgres

    Redis -->|Pop job| Worker
    Worker -->|Read file| ScanFolder
    Worker -->|Send image+text| Gemini
    Gemini -->|Return analysis| Worker
    Worker -->|Update status| Postgres

    Postgres -->|Poll analyzed docs| Mailer
    Mailer -->|Generate email| SMTP
    SMTP -->|Deliver| Email

    Email -->|Click review link| Browser
    Browser -->|HTTPS/REST| API
    API -->|Serve static| Frontend
    Frontend -->|Fetch doc data| API
    API -->|Query| Postgres
    API -->|Auth check| Redis

    Browser -->|Approve action| API
    API -->|Move file| OutputFolders
    API -->|Update status| Postgres

    OutputFolders -->|Volume mount| API

    style Watcher fill:#e3f2fd
    style Worker fill:#e3f2fd
    style API fill:#e3f2fd
    style Mailer fill:#e3f2fd
    style Gemini fill:#fff3e0
    style SMTP fill:#fff3e0
```

### Architectural Patterns

- **Microservices with Shared Database:** Each service runs independently in separate container but shares PostgreSQL for state coordination. Simpler than service-per-database pattern for MVP; acceptable given low write contention.

- **Event-Driven Queue Processing:** File detection triggers queue jobs consumed asynchronously by worker. Decouples ingestion from analysis for resilience (worker crashes don't affect file watching).

- **Polling-Based File Monitoring:** File watcher uses periodic polling (3-second intervals) instead of inotify/fs.watch events. More reliable across network shares (NFS/SMB) where event-based watching misses events.

- **Backend-for-Frontend (BFF) Pattern:** Express API serves dual purpose—REST endpoints for frontend AND static file hosting. Simplifies deployment (single origin, no CORS complexity) and authentication (session cookies work seamlessly).

- **Repository Pattern (Data Access Layer):** Database queries abstracted behind repository modules (`documentRepo.js`, `userRepo.js`). Enables testing with mock repositories and potential database migration (PostgreSQL → MySQL) without changing business logic.

- **Optimistic UI with Background Processing:** Frontend shows immediate success confirmation after approval action, while file operation executes asynchronously. Improves perceived performance (user sees <100ms response) while actual file I/O may take 1-5 seconds.

- **Stateless Service Design:** All services are stateless (state lives in PostgreSQL/Redis). Enables horizontal scaling (run multiple worker containers) and simplifies restart recovery.

- **Circuit Breaker for External APIs:** Gemini API calls wrapped in circuit breaker pattern (after 3 consecutive failures, pause requests for 60 seconds). Prevents cascading failures if Gemini is temporarily unavailable.

---

## Tech Stack

### Technology Stack Table

| Category             | Technology                                  | Version     | Purpose                                   | Rationale                                                                                                                                                |
| -------------------- | ------------------------------------------- | ----------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend Language    | TypeScript                                  | 5.3+        | Type-safe frontend code                   | Shares type definitions with backend (data models in `shared/`), catches errors at compile time, excellent IDE support                                   |
| Frontend Framework   | Vanilla JavaScript                          | ES2022      | Lightweight UI with minimal dependencies  | No framework overhead (React/Vue add 100KB+), faster load times (<2s on 3G), simple debugging, aligns with "invisible UI" goal                           |
| UI Component Library | Custom Components                           | N/A         | Minimal component set (8 core)            | PRD specifies custom design system, avoids Material-UI bloat (500KB+), full control over accessibility and branding                                      |
| State Management     | None (DOM-based)                            | N/A         | Direct DOM manipulation for simple UI     | No global state needed—each review page is isolated session, reduces complexity vs Redux/Zustand                                                         |
| Backend Language     | TypeScript (transpiled to JS)               | 5.3+        | Type-safe Node.js services                | Shares types with frontend, prevents runtime errors in async code, excellent for API contracts                                                           |
| Backend Framework    | Express.js                                  | 4.18+       | Lightweight REST API server               | Battle-tested, minimal overhead, middleware ecosystem (auth, CORS, logging), simpler than NestJS for MVP                                                 |
| API Style            | REST                                        | N/A         | HTTP JSON endpoints                       | Simpler than GraphQL for CRUD operations, no complex queries needed, native browser fetch() support                                                      |
| Database             | PostgreSQL                                  | 16          | Relational storage for documents/users    | ACID compliance for document state, JSONB for flexible analysis results, excellent Node.js drivers (pg), free and open-source                            |
| Cache                | Redis                                       | 7           | Queue + session cache + rate limiting     | Fast in-memory storage (<1ms latency), BullMQ Lite integration, pub/sub for service coordination, persistence options for queue reliability              |
| File Storage         | Host File System                            | N/A         | Network share mounting (NFS/SMB)          | Zero cost, already exists in target environments, Docker volume mounts provide abstraction, aligns with compliance requirements (data stays on-premises) |
| Authentication       | JWT (jsonwebtoken)                          | 9.0+        | Stateless auth tokens                     | RS256 signing for security, 24-hour expiration, no server-side session storage (scales horizontally), standard Bearer token pattern                      |
| Frontend Testing     | Vitest                                      | 1.0+        | Unit tests for utility functions          | Faster than Jest (Vite-powered), ESM-native, good TypeScript support, minimal config                                                                     |
| Backend Testing      | Vitest + Supertest                          | 1.0+ / 6.3+ | Unit + integration tests for API/services | Supertest for HTTP endpoint testing, Vitest for service logic, unified test framework across frontend/backend                                            |
| E2E Testing          | Manual Testing                              | N/A         | Browser workflow validation               | Playwright/Cypress deferred to post-MVP (too much setup overhead), manual checklist sufficient for MVP                                                   |
| Build Tool           | esbuild (via tsx)                           | 0.19+       | Fast TypeScript transpilation             | 100x faster than tsc, single-command dev server (tsx watch), minimal config, builds entire backend in <1s                                                |
| Bundler              | None (for backend) / esbuild (for frontend) | N/A / 0.19+ | Frontend asset bundling                   | Backend uses Node.js native ESM (no bundling), frontend bundles to single JS file for performance                                                        |
| IaC Tool             | Docker Compose                              | 2.0+        | Container orchestration                   | Declarative service definitions, one-command deployment, simpler than Terraform/Ansible for single-host setup                                            |
| CI/CD                | GitHub Actions                              | N/A         | Automated testing + Docker builds         | Free for open-source, YAML-based workflows, Docker Hub integration for image publishing                                                                  |
| Monitoring           | Pino (logging) + manual metrics             | 8.16+       | Structured JSON logs to stdout            | High-performance logging (50k logs/sec), integrates with Docker logs, post-MVP: Grafana/Prometheus for dashboards                                        |
| Logging              | Pino                                        | 8.16+       | Structured JSON logs                      | Outputs to stdout (Docker captures), filterable by service/level, supports child loggers for request tracing                                             |
| CSS Framework        | Custom (Tailwind-inspired)                  | N/A         | Utility classes for rapid styling         | Inline styles + minimal CSS file, no build step for MVP, Tailwind color palette for accessibility-tested contrast                                        |

**Notes:**

- **No ORM:** Using raw SQL with `pg` library instead of TypeORM/Prisma to reduce complexity and improve performance (ORMs add overhead for simple queries).
- **No frontend build step initially:** Development uses native ESM modules in browser, production bundles with esbuild for single request (trade-off: faster dev iteration vs optimized production).
- **Gemini API:** Official `@google/generative-ai` SDK (v0.1.3+) for multimodal analysis, configurable to swap models (Flash → Pro) via environment variable.

---

## Data Models

### Document Model

**Purpose:** Represents a scanned document throughout its lifecycle from detection through AI analysis to user approval and filing.

**Key Attributes:**

- `id` (UUID): Unique identifier for document, generated on detection
- `filename` (string): Original scanned filename (e.g., `invoice_20251003_143052.pdf`)
- `scan_path` (string): Absolute path to file in scan folder at detection time
- `scan_timestamp` (timestamp): When file was detected by watcher service
- `status` (enum): Current processing state—`queued`, `processing`, `analyzed`, `filed`, `rejected`, `failed`
- `analysis_result` (JSONB): Gemini API response with classification, confidence, extracted fields, reasoning
- `destination_path` (string, nullable): Final folder path after approval (null until user approves)
- `user_action` (string, nullable): User's action—`approved`, `rejected`, `edited` (null until user acts)
- `user_id` (UUID, nullable): Foreign key to User who reviewed document (null if not yet reviewed)
- `created_at` (timestamp): Record creation time
- `updated_at` (timestamp): Last modification time

**Relationships:**

- BelongsTo User (via `user_id`) - one document reviewed by one user
- HasMany ProcessingQueue entries (one document can have multiple retry attempts)

#### TypeScript Interface

```typescript
interface Document {
  id: string; // UUID v4
  filename: string;
  scan_path: string;
  scan_timestamp: Date;
  status: 'queued' | 'processing' | 'analyzed' | 'filed' | 'rejected' | 'failed';
  analysis_result: AnalysisResult | null;
  destination_path: string | null;
  user_action: 'approved' | 'rejected' | 'edited' | null;
  user_id: string | null; // UUID reference to User
  created_at: Date;
  updated_at: Date;
}

interface AnalysisResult {
  document_type: string; // e.g., "Packing List", "Invoice", "Purchase Order"
  confidence_score: number; // 0-100
  extracted_fields: {
    vendor?: string;
    po_number?: string;
    date?: string;
    amount?: string;
    [key: string]: string | undefined; // Additional dynamic fields
  };
  recommended_folder_path: string;
  recommended_filename: string;
  reasoning: string; // 1-2 sentence AI explanation
  analyzed_at: string; // ISO 8601 timestamp
  is_partial_analysis: boolean; // true if document had 50+ pages
  total_pages?: number;
  analyzed_pages?: number;
}
```

---

### User Model

**Purpose:** Represents authenticated users who can review and approve document routing recommendations.

**Key Attributes:**

- `id` (UUID): Unique user identifier
- `username` (string, unique): Login username (email format optional for MVP)
- `password_hash` (string): bcrypt hash of password (never store plaintext)
- `created_at` (timestamp): Account creation time
- `updated_at` (timestamp): Last modification time

**Relationships:**

- HasMany Documents (via `user_id`) - one user can review multiple documents

#### TypeScript Interface

```typescript
interface User {
  id: string; // UUID v4
  username: string; // Unique, min 3 chars
  password_hash: string; // bcrypt hashed, never exposed in API responses
  created_at: Date;
  updated_at: Date;
}

// API response type (excludes sensitive fields)
interface UserDTO {
  id: string;
  username: string;
  created_at: Date;
}
```

---

### ProcessingQueue Model

**Purpose:** Tracks document analysis jobs in Redis queue with retry state and error handling.

**Key Attributes:**

- `id` (UUID): Unique queue entry identifier
- `document_id` (UUID): Foreign key to Document being processed
- `status` (enum): Queue state—`pending`, `processing`, `completed`, `failed`
- `retry_count` (integer): Number of retry attempts (max 3)
- `error_message` (string, nullable): Error details if job failed
- `created_at` (timestamp): Job creation time
- `completed_at` (timestamp, nullable): Job completion time

**Relationships:**

- BelongsTo Document (via `document_id`) - each queue entry processes one document

#### TypeScript Interface

```typescript
interface ProcessingQueue {
  id: string; // UUID v4
  document_id: string; // UUID reference to Document
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retry_count: number; // Default 0, max 3
  error_message: string | null;
  created_at: Date;
  completed_at: Date | null;
}

// Job payload structure for Redis queue
interface QueueJob {
  documentId: string; // UUID
  filename: string;
  scanPath: string;
  detectedAt: string; // ISO 8601 timestamp
  retryCount?: number; // Optional, defaults to 0
}
```

---

### Batch Model

**Purpose:** Groups multiple analyzed documents for batch email notifications (15-second idle trigger).

**Key Attributes:**

- `id` (UUID): Unique batch identifier
- `document_ids` (UUID[]): Array of document IDs included in this batch
- `created_at` (timestamp): When first document was analyzed (batch trigger started)
- `triggered_at` (timestamp): When idle timeout expired and email generation started
- `email_sent_at` (timestamp, nullable): When email successfully sent (null if failed)
- `status` (enum): Batch state—`pending`, `triggered`, `sent`, `send_failed`
- `error_message` (string, nullable): SMTP error details if send failed

**Relationships:**

- HasMany Documents (via `document_ids` array) - one batch contains multiple documents

#### TypeScript Interface

```typescript
interface Batch {
  id: string; // UUID v4
  document_ids: string[]; // Array of Document UUIDs
  created_at: Date;
  triggered_at: Date | null;
  email_sent_at: Date | null;
  status: 'pending' | 'triggered' | 'sent' | 'send_failed';
  error_message: string | null;
}

// Email template data structure
interface BatchEmailData {
  batch_id: string;
  document_count: number;
  documents: Array<{
    id: string;
    filename: string;
    document_type: string;
    confidence_score: number;
    recommended_folder: string;
    recommended_filename: string;
    thumbnail_base64: string; // Data URI for inline image
    review_link: string; // {WEB_UI_BASE_URL}/review/{document_id}?token={jwt}
  }>;
}
```

---

## API Specification

### REST API Specification

```yaml
openapi: 3.0.0
info:
  title: ai.scanner REST API
  version: 1.0.0
  description: Backend API for ai.scanner document routing system providing authentication, document metadata access, and approval workflow endpoints.

servers:
  - url: http://localhost:3000
    description: Local development server
  - url: https://ai-scanner.local
    description: Production deployment (self-signed cert acceptable for MVP)

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
      description: JWT token obtained from /auth/login endpoint (RS256 signed, 24h expiration)

  schemas:
    Document:
      type: object
      properties:
        id:
          type: string
          format: uuid
        filename:
          type: string
        scan_timestamp:
          type: string
          format: date-time
        status:
          type: string
          enum: [queued, processing, analyzed, filed, rejected, failed]
        analysis_result:
          $ref: '#/components/schemas/AnalysisResult'
        destination_path:
          type: string
          nullable: true
        user_action:
          type: string
          enum: [approved, rejected, edited]
          nullable: true

    AnalysisResult:
      type: object
      properties:
        document_type:
          type: string
        confidence_score:
          type: number
          minimum: 0
          maximum: 100
        extracted_fields:
          type: object
          additionalProperties: true
        recommended_folder_path:
          type: string
        recommended_filename:
          type: string
        reasoning:
          type: string
        is_partial_analysis:
          type: boolean

    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        username:
          type: string
        created_at:
          type: string
          format: date-time

    Error:
      type: object
      properties:
        error:
          type: object
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: object
              additionalProperties: true
            timestamp:
              type: string
              format: date-time
            requestId:
              type: string
              format: uuid

paths:
  /health:
    get:
      summary: Health check endpoint
      description: Returns service health status for monitoring
      responses:
        '200':
          description: Service is healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: healthy
                  timestamp:
                    type: string
                    format: date-time
                  version:
                    type: string
                    example: 1.0.0

  /health/db:
    get:
      summary: Database health check
      description: Tests PostgreSQL connection
      responses:
        '200':
          description: Database connection successful
        '503':
          description: Database connection failed

  /auth/register:
    post:
      summary: Register new user
      description: Create user account with bcrypt password hashing (10 rounds)
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - username
                - password
              properties:
                username:
                  type: string
                  minLength: 3
                password:
                  type: string
                  minLength: 8
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  token:
                    type: string
                    description: JWT token for immediate login
                  user:
                    $ref: '#/components/schemas/User'
        '409':
          description: Username already exists
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /auth/login:
    post:
      summary: User login
      description: Authenticate with username/password and receive JWT token
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - username
                - password
              properties:
                username:
                  type: string
                password:
                  type: string
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  token:
                    type: string
                    description: JWT token (24h expiration)
                  user:
                    $ref: '#/components/schemas/User'
        '401':
          description: Invalid credentials
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /api/documents/{documentId}:
    get:
      summary: Get document metadata
      description: Retrieve document details for review page
      security:
        - BearerAuth: []
      parameters:
        - name: documentId
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: token
          in: query
          description: Review token from email link (alternative to Bearer auth)
          schema:
            type: string
      responses:
        '200':
          description: Document found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Document'
        '401':
          description: Unauthorized (invalid token)
        '404':
          description: Document not found

  /api/documents/{documentId}/approve:
    post:
      summary: Approve document routing
      description: Execute file move operation with user-confirmed destination
      security:
        - BearerAuth: []
      parameters:
        - name: documentId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - destination_folder
                - filename
              properties:
                destination_folder:
                  type: string
                  example: /Quality/Suppliers/AcmeCorp/POs
                filename:
                  type: string
                  example: PO-12345_AcmeCorp_2025-10-03.pdf
      responses:
        '200':
          description: Document filed successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  message:
                    type: string
                  destination:
                    type: string
                    description: Full file path where document was filed
        '409':
          description: File already exists at destination
        '500':
          description: File operation failed

  /api/documents/{documentId}/reject:
    post:
      summary: Reject document for manual review
      description: Move document to manual queue folder with optional rejection note
      security:
        - BearerAuth: []
      parameters:
        - name: documentId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                reason:
                  type: string
                  maxLength: 500
                  description: Optional explanation for rejection
      responses:
        '200':
          description: Document rejected and moved to manual queue
        '500':
          description: Rejection operation failed

  /admin/reload-data:
    post:
      summary: Reload external data sources
      description: Refresh PO logs, vendor lists, folder structure from CSV/JSON files (requires authentication)
      security:
        - BearerAuth: []
      responses:
        '200':
          description: Data sources reloaded
          content:
            application/json:
              schema:
                type: object
                properties:
                  po_logs_count:
                    type: integer
                  vendors_count:
                    type: integer
                  folders_count:
                    type: integer
```

**Authentication Flow:**

1. User POSTs credentials to `/auth/login`
2. Server validates against bcrypt hash in database
3. Server generates JWT with RS256 signing (private key from env)
4. Client stores token in localStorage
5. Subsequent requests include `Authorization: Bearer {token}` header
6. API middleware validates signature with public key, checks expiration
7. Token payload includes `{ user_id, username, iat, exp }` claims

**Error Response Format (Standardized):**
All errors return JSON with structure:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid username or password",
    "details": {},
    "timestamp": "2025-10-03T14:30:52.123Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

---

## Components

### Component: File Watcher Service

**Responsibility:** Continuously monitor scan folder for new PDF and image files using polling-based file system checks, detect file creation with stability validation (wait for file writes to complete), and queue discovered documents for AI analysis.

**Key Interfaces:**

- **Outbound:** `queue.addJob(documentData)` - Enqueue document for processing
- **Outbound:** `documentRepo.create(doc)` - Store document metadata in database
- **Inbound:** File system read operations (`fs.readdir`, `fs.stat`) on scan folder path

**Dependencies:**

- PostgreSQL database (via `documentRepo`)
- Redis queue (via `queue` module)
- Host file system (scan folder mounted as Docker volume)

**Technology Stack:**

- Node.js with TypeScript
- `fs/promises` for async file operations
- `chokidar` library (in polling mode) or custom polling loop with `setInterval`
- `pino` logger for structured logging

**Configuration (Environment Variables):**

- `SCAN_FOLDER_PATH` - Path to monitored folder (e.g., `/mnt/scan-folder`)
- `POLL_INTERVAL_MS` - Polling frequency (default 3000ms)
- `FILE_STABILITY_TIMEOUT_MS` - Time to wait for file size stabilization (default 6000ms)
- `SUPPORTED_EXTENSIONS` - Comma-separated list (default: `.pdf,.png,.jpg,.jpeg,.tiff`)

**Operational Notes:**

- Runs as long-lived process in Docker container with restart policy
- Exposes GET `/health` endpoint for monitoring (returns last poll timestamp)
- Graceful shutdown on SIGTERM (stops polling, waits for current operation to complete)
- Handles folder access errors with retry logic (30-second backoff)

---

### Component: Analysis Worker Service

**Responsibility:** Consume document analysis jobs from Redis queue, load external data sources (PO logs, vendor lists, folder structures), extract text and images from documents, send multimodal prompts to Gemini Vision API for classification and routing recommendations, parse and validate AI responses, and update database with analysis results.

**Key Interfaces:**

- **Inbound:** `queue.getNextJob()` - Pop document from processing queue
- **Outbound:** Gemini API (`generateContent` with image + text prompt)
- **Outbound:** `documentRepo.update(id, analysis_result)` - Store AI analysis in database
- **Inbound:** File system read (document files from scan folder)

**Dependencies:**

- PostgreSQL database (via `documentRepo`)
- Redis queue (via `queue` module)
- Google Gemini API (via `@google/generative-ai` SDK)
- File system (scan folder for reading documents)
- External data sources (CSV/JSON files mounted as volumes)

**Technology Stack:**

- Node.js with TypeScript
- `@google/generative-ai` SDK (v0.1.3+) for Gemini integration
- `pdf-parse` or `pdf-lib` for PDF text extraction
- `sharp` for image processing (resizing, format conversion)
- `csv-parser` for loading PO logs and vendor lists
- `pino` logger

**Configuration (Environment Variables):**

- `GEMINI_API_KEY` - Google AI API key (required)
- `GEMINI_MODEL` - Model name (default: `gemini-1.5-flash`)
- `PO_LOGS_PATH` - Path to PO logs CSV
- `VENDOR_LIST_PATH` - Path to vendor list CSV
- `FOLDER_STRUCTURE_PATH` - Path to folder structure JSON
- `GEMINI_RATE_LIMIT_RPM` - Requests per minute limit (default: 15 for free tier)

**Operational Notes:**

- Runs as long-lived process, can scale to multiple instances (queue ensures atomic job consumption)
- Implements circuit breaker for Gemini API (after 3 failures, pause 60s)
- Loads external data sources on startup, reloads on SIGHUP signal
- Large document handling (50+ pages): process only first 5 pages, include context in prompt
- Exposes GET `/health` and GET `/metrics` endpoints (last job processed, average confidence score, failure rate)

---

### Component: Express API Service

**Responsibility:** Serve as central HTTP gateway providing REST endpoints for authentication, document metadata retrieval, approval/rejection actions, and static file hosting for frontend web UI.

**Key Interfaces:**

- **Inbound:** HTTP requests from web browser (frontend)
- **Outbound:** `documentRepo.findById(id)` - Fetch document data
- **Outbound:** `userRepo.authenticate(username, password)` - Validate credentials
- **Outbound:** File system write (move/copy operations for approved documents)
- **Outbound:** Redis cache (session storage, rate limiting counters)

**Dependencies:**

- PostgreSQL database (via `documentRepo`, `userRepo`)
- Redis cache (via `redisClient` module)
- File system (scan folder for reading, output folders for writing)
- JWT library (`jsonwebtoken`) for auth token generation/validation

**Technology Stack:**

- Node.js with TypeScript
- `express` framework (v4.18+)
- `jsonwebtoken` for JWT auth (RS256 algorithm)
- `bcrypt` for password hashing (10 rounds)
- `helmet` middleware for security headers
- `cors` middleware (allow frontend origin)
- `express-rate-limit` for API rate limiting
- `pino-http` for request logging

**Configuration (Environment Variables):**

- `PORT` - HTTP listen port (default: 3000)
- `JWT_PRIVATE_KEY` - RS256 private key (PEM format)
- `JWT_PUBLIC_KEY` - RS256 public key (PEM format)
- `REVIEW_TOKEN_SECRET` - Secret for short-lived review tokens (HS256)
- `ALLOWED_ORIGINS` - CORS allowed origins (comma-separated)
- `OUTPUT_FOLDER_BASE` - Base path for output folders

**Operational Notes:**

- Serves static files from `frontend/` directory at root path (`/`)
- Authentication middleware validates JWT on protected routes
- Graceful shutdown closes database connections, flushes Redis buffers
- HTTPS via reverse proxy (Nginx/Traefik) or self-signed cert for development
- Exposes GET `/health`, GET `/health/db`, GET `/health/redis` for monitoring

---

### Component: Email Service (Mailer)

**Responsibility:** Monitor database for analyzed documents, implement 15-second idle trigger to batch multiple documents into single email summary, generate HTML email templates with document thumbnails and AI recommendations, and deliver batch notification emails via SMTP.

**Key Interfaces:**

- **Inbound:** Database polling (`SELECT * FROM documents WHERE status='analyzed' AND notified=false`)
- **Outbound:** SMTP server (via `nodemailer`)
- **Outbound:** `documentRepo.update(id, { notified: true })` - Mark documents as notified
- **Outbound:** `batchRepo.create(batch)` - Store batch metadata
- **Inbound:** File system read (document thumbnails generation)

**Dependencies:**

- PostgreSQL database (via `documentRepo`, `batchRepo`)
- SMTP server (Gmail, SendGrid, AWS SES, or local relay)
- File system (scan folder for reading documents to generate thumbnails)

**Technology Stack:**

- Node.js with TypeScript
- `nodemailer` for SMTP email delivery
- `handlebars` or `mustache` for HTML template rendering
- `sharp` for thumbnail generation (resize to 200px width)
- `pino` logger

**Configuration (Environment Variables):**

- `SMTP_HOST` - SMTP server hostname
- `SMTP_PORT` - SMTP port (default: 587 for TLS, 465 for SSL)
- `SMTP_USER` - SMTP authentication username
- `SMTP_PASS` - SMTP authentication password
- `SMTP_FROM` - Sender email address
- `NOTIFICATION_EMAIL` - Recipient email address (single user for MVP)
- `BATCH_IDLE_TIMEOUT_MS` - Idle time before sending email (default: 15000ms)
- `WEB_UI_BASE_URL` - Base URL for review links (e.g., `https://ai-scanner.local`)

**Operational Notes:**

- Runs as long-lived process with 2-second polling interval
- Generates review tokens as short-lived JWTs (4-hour expiration)
- Email template includes plain text fallback for non-HTML clients
- Retry logic for failed sends (3 attempts with exponential backoff)
- Failed batches logged for manual investigation
- Exposes GET `/health` (last batch sent timestamp) and GET `/admin/batches` (batch history)

---

### Component: Shared Package

**Responsibility:** Provide shared TypeScript type definitions, utility functions, and constants used across frontend and backend services to ensure type safety and code reuse in monorepo.

**Key Interfaces:**

- **Exports:** TypeScript interfaces (`Document`, `User`, `AnalysisResult`, etc.)
- **Exports:** Utility functions (filename sanitization, path validation, date formatting)
- **Exports:** Constants (file extensions, status enums, API error codes)

**Dependencies:** None (standalone package)

**Technology Stack:**

- TypeScript (type definitions only, no runtime code)
- Pure JavaScript utilities (no external dependencies for maximum portability)

**Package Contents:**

```
shared/
├── src/
│   ├── types/
│   │   ├── document.ts          # Document, AnalysisResult interfaces
│   │   ├── user.ts              # User, UserDTO interfaces
│   │   ├── queue.ts             # QueueJob, ProcessingQueue interfaces
│   │   └── api.ts               # API request/response types
│   ├── utils/
│   │   ├── filename.ts          # sanitizeFilename(), validateFilename()
│   │   ├── paths.ts             # normalizePath(), validateFolderPath()
│   │   └── dates.ts             # formatTimestamp(), parseDate()
│   ├── constants/
│   │   ├── statuses.ts          # Document status enum
│   │   ├── errors.ts            # API error codes
│   │   └── config.ts            # Default values (poll intervals, etc.)
│   └── index.ts                 # Re-export all modules
└── package.json
```

**Usage Example:**

```typescript
// In frontend/src/api/documents.ts
import { Document, AnalysisResult } from '@ai-scanner/shared';

// In services/worker/src/validator.ts
import { sanitizeFilename } from '@ai-scanner/shared/utils/filename';
```

---

### Component Diagrams

```mermaid
graph TB
    subgraph "Frontend Container"
        WebUI[Web UI<br/>Static HTML/JS/CSS]
    end

    subgraph "API Container"
        Express[Express Server]
        AuthMW[Auth Middleware]
        DocumentCtrl[Document Controller]
        FileOps[File Operations]
    end

    subgraph "Watcher Container"
        FilePoller[File Poller]
        StabilityChecker[Stability Checker]
    end

    subgraph "Worker Container"
        JobConsumer[Job Consumer]
        DataLoader[Data Loader]
        GeminiClient[Gemini Client]
        ResponseParser[Response Parser]
    end

    subgraph "Mailer Container"
        BatchPoller[Batch Poller]
        EmailGenerator[Email Generator]
        SMTPClient[SMTP Client]
    end

    subgraph "Data Layer"
        DocumentRepo[(Document Repo)]
        UserRepo[(User Repo)]
        Queue[(Queue Module)]
    end

    WebUI -->|HTTP Requests| Express
    Express --> AuthMW
    AuthMW --> DocumentCtrl
    DocumentCtrl --> DocumentRepo
    DocumentCtrl --> FileOps

    FilePoller --> StabilityChecker
    StabilityChecker --> Queue
    StabilityChecker --> DocumentRepo

    Queue --> JobConsumer
    JobConsumer --> DataLoader
    DataLoader --> GeminiClient
    GeminiClient --> ResponseParser
    ResponseParser --> DocumentRepo

    DocumentRepo --> BatchPoller
    BatchPoller --> EmailGenerator
    EmailGenerator --> SMTPClient

    style WebUI fill:#e1f5fe
    style Express fill:#fff3e0
    style FilePoller fill:#f3e5f5
    style JobConsumer fill:#e8f5e9
    style BatchPoller fill:#fce4ec
```

**Component Interaction Notes:**

- All services communicate asynchronously (no direct HTTP calls between backend services)
- Database serves as state coordination layer (no service-to-service messaging)
- Queue decouples producer (watcher) from consumer (worker) for resilience
- Redis pub/sub used for optional real-time updates (worker notifies mailer when analysis complete)

---

## External APIs

### Google Gemini Vision API

- **Purpose:** Multimodal AI analysis of document images and extracted text for classification, entity extraction, and intelligent routing recommendations
- **Documentation:** https://ai.google.dev/docs/gemini_api_overview
- **Base URL(s):** `https://generativelanguage.googleapis.com/v1/models/{model}:generateContent`
- **Authentication:** API key in query parameter (`?key={GEMINI_API_KEY}`) or `x-goog-api-key` header (SDK handles automatically)
- **Rate Limits:** Free tier: 15 requests/minute, 1500 requests/day; Paid tier: 1000 requests/minute

**Key Endpoints Used:**

- `POST /v1/models/gemini-1.5-flash:generateContent` - Submit multimodal prompt (image + text) for analysis, receive structured JSON response with classification

**Integration Notes:**

- Use official `@google/generative-ai` Node.js SDK (handles retries, rate limiting)
- Configure `generation_config` for structured output: `response_mime_type: "application/json"`, `temperature: 0.2` (deterministic)
- Prompt engineering: Load template from `prompts/analysis-prompt.txt`, inject external data context (PO logs snippet, vendor list, folder structure)
- Error handling: Retry 3 times with exponential backoff (1s, 2s, 4s) on transient errors (500, 503), fail fast on client errors (400, 401)
- Cost optimization: Use Gemini 1.5 Flash (cheapest, fastest) for MVP; upgrade to Pro if accuracy issues
- Circuit breaker: After 3 consecutive API failures, pause requests for 60 seconds to avoid hammering failed endpoint

**Example Request (via SDK):**

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    temperature: 0.2,
  },
});

const result = await model.generateContent([
  { text: promptText }, // Includes context + instructions
  { inlineData: { data: imageBase64, mimeType: 'image/png' } },
]);

const analysis = JSON.parse(result.response.text());
```

---

## Core Workflows

### Workflow: End-to-End Document Processing

This sequence diagram illustrates the complete lifecycle of a scanned document from detection through AI analysis to user approval and final filing.

```mermaid
sequenceDiagram
    participant Scanner as Document Scanner
    participant FS as File System (Scan Folder)
    participant Watcher as File Watcher Service
    participant DB as PostgreSQL Database
    participant Queue as Redis Queue
    participant Worker as Analysis Worker
    participant Gemini as Gemini Vision API
    participant Mailer as Email Service
    participant SMTP as SMTP Server
    participant User as User (Email Client)
    participant Browser as Web Browser
    participant API as Express API

    Scanner->>FS: Save scanned document (invoice.pdf)

    loop Polling every 3s
        Watcher->>FS: Check for new files
    end

    Watcher->>FS: Detect new file: invoice.pdf
    Watcher->>Watcher: Check file stability (size unchanged for 6s)
    Watcher->>DB: INSERT document (status='queued')
    Watcher->>Queue: LPUSH job (documentId, filename, scanPath)

    Worker->>Queue: BRPOP job (blocking pop)
    Queue-->>Worker: Return job data
    Worker->>DB: UPDATE document (status='processing')
    Worker->>FS: Read invoice.pdf
    Worker->>Worker: Extract text (OCR via Gemini), generate thumbnail
    Worker->>Gemini: POST /generateContent (image + text + context)
    Gemini-->>Worker: Return JSON analysis (type, confidence, fields, recommendation)
    Worker->>Worker: Validate and parse response
    Worker->>DB: UPDATE document (status='analyzed', analysis_result=JSON)
    Worker->>Worker: Trigger notification check (Redis pub/sub)

    loop Poll DB every 2s
        Mailer->>DB: SELECT documents WHERE status='analyzed' AND notified=false
    end

    Mailer->>Mailer: Start 15s idle timer
    Note over Mailer: Wait 15s for more documents (batching)
    Mailer->>FS: Generate thumbnails for batch
    Mailer->>Mailer: Render HTML email template (Handlebars)
    Mailer->>SMTP: Send batch summary email (HTML + plain text)
    SMTP-->>User: Deliver email to inbox
    Mailer->>DB: UPDATE documents (notified=true), INSERT batch record

    User->>Browser: Click review link (/review/{docId}?token={jwt})
    Browser->>API: GET /api/documents/{docId} (with review token)
    API->>API: Validate review token (JWT signature + expiration)
    API->>DB: SELECT document WHERE id={docId}
    DB-->>API: Return document + analysis_result
    API-->>Browser: JSON response (document data)
    Browser->>Browser: Render document preview + AI analysis card

    User->>Browser: Review recommendation, click "Approve & File"
    Browser->>API: POST /api/documents/{docId}/approve (destination_folder, filename)
    API->>API: Validate JWT auth token
    API->>FS: Move file from scan_path to destination_folder/filename
    API->>DB: UPDATE document (status='filed', destination_path, user_action='approved')
    API-->>Browser: 200 OK (success message)
    Browser->>Browser: Show success confirmation, redirect after 2s
```

**Error Handling Paths (Not Shown Above):**

- **File Lock Detected:** Watcher retries stability check for up to 30 seconds, then marks document as `failed` with error message
- **Gemini API Timeout:** Worker retries job 3 times, then updates status to `analysis_failed`
- **SMTP Send Failure:** Mailer retries 3 times with exponential backoff, marks batch as `send_failed` for manual investigation
- **File Operation Failure (Approval):** API returns 500 error, frontend shows retry button, document stays in `analyzed` state

**Performance Optimizations:**

- Worker processes documents in parallel (multiple worker instances can run simultaneously)
- Frontend uses optimistic UI (shows success immediately while file operation completes in background)
- Batch email reduces SMTP overhead (single email for multiple documents vs individual emails)
- Redis blocking pop (`BRPOP`) eliminates polling overhead in worker (waits for job instead of checking every second)

---

## Database Schema

### PostgreSQL Schema (SQL DDL)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- bcrypt hash
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents table (core entity)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    scan_path TEXT NOT NULL, -- Absolute path to file in scan folder
    scan_timestamp TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('queued', 'processing', 'analyzed', 'filed', 'rejected', 'failed')),
    analysis_result JSONB, -- Structured AI response (document_type, confidence_score, extracted_fields, etc.)
    destination_path TEXT, -- Final file location after approval
    user_action VARCHAR(50) CHECK (user_action IN ('approved', 'rejected', 'edited')),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notified BOOLEAN DEFAULT FALSE, -- Has batch email been sent?
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_notified ON documents(notified) WHERE status = 'analyzed'; -- Partial index for email service

-- Processing queue table (tracks retry state)
CREATE TABLE processing_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_processing_queue_status ON processing_queue(status);
CREATE INDEX idx_processing_queue_document_id ON processing_queue(document_id);

-- Batches table (email notification groups)
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_ids UUID[] NOT NULL, -- Array of document IDs in this batch
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    triggered_at TIMESTAMP, -- When idle timeout expired
    email_sent_at TIMESTAMP, -- When email successfully sent
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'triggered', 'sent', 'send_failed')),
    error_message TEXT
);

CREATE INDEX idx_batches_status ON batches(status);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Schema Design Notes:**

- **JSONB for analysis_result:** Flexible schema for Gemini responses (field structure may evolve without migrations)
- **Partial index on notified:** Optimizes email service query (`WHERE status='analyzed' AND notified=false`) by indexing only relevant rows
- **ON DELETE CASCADE for processing_queue:** When document deleted, related queue entries auto-deleted (cleanup)
- **ON DELETE SET NULL for user_id:** Preserve document records even if user account deleted (audit trail)
- **UUID primary keys:** Enable distributed ID generation, avoid sequential ID enumeration attacks
- **CHECK constraints:** Enforce valid enum values at database level (redundant with app validation for data integrity)

**Migration Strategy:**

- Use `node-pg-migrate` library for version-controlled schema changes
- Initial migration creates tables above
- Future migrations handled via numbered migration files (`001_initial_schema.sql`, `002_add_columns.sql`)
- Migrations run automatically on API service startup (`npm run migrate:up`)

---

## Frontend Architecture

### Component Architecture

**Component Organization:**

```
frontend/
├── index.html               # Main entry point (SPA shell)
├── css/
│   └── styles.css          # Global styles + utility classes
├── js/
│   ├── app.js              # Main app initialization, router
│   ├── api/
│   │   ├── client.js       # Fetch wrapper, auth token injection
│   │   └── documents.js    # Document API methods (getDocument, approve, reject)
│   ├── components/
│   │   ├── Button.js       # Reusable button component
│   │   ├── Card.js         # Card container component
│   │   ├── Badge.js        # Confidence score badge
│   │   ├── Modal.js        # Modal overlay component
│   │   └── DocumentPreview.js  # PDF/image viewer component
│   ├── pages/
│   │   ├── LoginPage.js    # Login screen logic
│   │   ├── ReviewPage.js   # Document review screen logic
│   │   └── SuccessPage.js  # Success confirmation logic
│   ├── utils/
│   │   ├── auth.js         # Token storage, validation
│   │   ├── router.js       # Client-side routing
│   │   └── dom.js          # DOM manipulation helpers
│   └── constants.js        # API endpoints, status enums
└── assets/
    └── icons/              # SVG icons (inline or sprite)
```

**Component Template (Button.js Example):**

```typescript
// frontend/js/components/Button.js
export class Button {
  constructor(options) {
    this.text = options.text;
    this.variant = options.variant || 'primary'; // primary, secondary, ghost
    this.onClick = options.onClick;
    this.loading = options.loading || false;
  }

  render() {
    const button = document.createElement('button');
    button.className = `btn btn-${this.variant}`;
    button.textContent = this.loading ? 'Loading...' : this.text;
    button.disabled = this.loading;
    button.addEventListener('click', this.onClick);
    return button;
  }

  setLoading(loading) {
    this.loading = loading;
    // Re-render or update DOM
  }
}

// Usage in ReviewPage.js:
const approveBtn = new Button({
  text: 'Approve & File',
  variant: 'primary',
  onClick: handleApprove,
});
document.querySelector('#actions').appendChild(approveBtn.render());
```

### State Management Architecture

**State Structure:**

```typescript
// No global state management library (Redux/Zustand) for MVP
// Each page manages its own local state via closures and DOM data attributes

// Example: ReviewPage state (closure-based)
function ReviewPage(documentId) {
  let document = null; // Local state
  let isSubmitting = false;

  async function loadDocument() {
    document = await fetchDocument(documentId);
    render();
  }

  function handleApprove() {
    isSubmitting = true;
    render();
    // Submit API call...
  }

  function render() {
    // Update DOM based on current state
    document.querySelector('#preview').innerHTML = renderPreview(document);
    document.querySelector('#approve-btn').disabled = isSubmitting;
  }

  return { loadDocument, handleApprove };
}
```

**State Management Patterns:**

- **Page-Level State:** Each page (LoginPage, ReviewPage) manages own state via closures (no global store)
- **URL as State:** Document ID and review token stored in URL query params (bookmarkable, shareable links)
- **LocalStorage for Auth:** JWT token persisted in localStorage for session continuity across page reloads
- **Optimistic Updates:** Approval action updates UI immediately (show success state), then sends API request in background

**Rationale:** No global state needed—each review page is isolated session with single document. Avoids complexity of Redux/Zustand for simple use case. URL-driven state enables direct linking to specific documents.

### Routing Architecture

**Route Organization:**

```javascript
// frontend/js/utils/router.js
const routes = {
  '/': LoginPage, // Default route redirects to login if not authenticated
  '/login': LoginPage,
  '/review/:documentId': ReviewPage,
  '/success': SuccessPage,
};

function router() {
  const path = window.location.pathname;
  const params = extractParams(path); // Parse :documentId from URL

  const PageComponent = matchRoute(path, routes);
  if (!PageComponent) {
    render404Page();
    return;
  }

  // Check auth before protected routes
  if (path !== '/login' && !isAuthenticated()) {
    window.history.pushState({}, '', '/login?returnUrl=' + path);
    LoginPage();
    return;
  }

  PageComponent(params);
}

// Listen for browser back/forward
window.addEventListener('popstate', router);

// Initial route on page load
document.addEventListener('DOMContentLoaded', router);
```

**Protected Route Pattern:**

```javascript
// frontend/js/utils/auth.js
export function isAuthenticated() {
  const token = localStorage.getItem('auth_token');
  if (!token) return false;

  // Decode JWT and check expiration (simple client-side check)
  const payload = JSON.parse(atob(token.split('.')[1]));
  const now = Math.floor(Date.now() / 1000);
  return payload.exp > now;
}

export function requireAuth() {
  if (!isAuthenticated()) {
    const returnUrl = window.location.pathname + window.location.search;
    window.location.href = `/login?returnUrl=${encodeURIComponent(returnUrl)}`;
  }
}

// Usage in ReviewPage.js:
export function ReviewPage(params) {
  requireAuth(); // Redirect to login if not authenticated
  // ... page logic
}
```

### Frontend Services Layer

**API Client Setup:**

```typescript
// frontend/js/api/client.js
const API_BASE_URL = window.location.origin; // Same-origin (no CORS)

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('auth_token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(API_BASE_URL + endpoint, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // Token expired, redirect to login
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  return response.json();
}
```

**Service Example (Document Service):**

```typescript
// frontend/js/api/documents.js
import { apiFetch } from './client.js';

export async function getDocument(documentId, reviewToken) {
  const endpoint = `/api/documents/${documentId}?token=${reviewToken}`;
  return apiFetch(endpoint, { method: 'GET' });
}

export async function approveDocument(documentId, destination) {
  const endpoint = `/api/documents/${documentId}/approve`;
  return apiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(destination),
  });
}

export async function rejectDocument(documentId, reason) {
  const endpoint = `/api/documents/${documentId}/reject`;
  return apiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

// Usage in ReviewPage.js:
import { getDocument, approveDocument } from './api/documents.js';

const doc = await getDocument(documentId, reviewToken);
await approveDocument(documentId, {
  destination_folder: '/Quality/Suppliers/AcmeCorp',
  filename: 'PO-12345.pdf',
});
```

---

## Backend Architecture

### Service Architecture (Traditional Server)

**Controller/Route Organization:**

```
services/api/src/
├── index.ts                  # Express app entry point
├── routes/
│   ├── auth.routes.ts       # POST /auth/login, /auth/register
│   ├── documents.routes.ts  # GET/POST /api/documents/*
│   ├── admin.routes.ts      # GET/POST /admin/* (protected)
│   └── health.routes.ts     # GET /health, /health/db, /health/redis
├── controllers/
│   ├── auth.controller.ts   # Login/register logic
│   ├── documents.controller.ts  # Document CRUD, approve/reject
│   └── admin.controller.ts  # Data reload, metrics
├── middleware/
│   ├── auth.middleware.ts   # JWT validation
│   ├── error.middleware.ts  # Global error handler
│   └── logger.middleware.ts # Request logging (pino-http)
├── repositories/
│   ├── document.repo.ts     # Database queries for documents
│   ├── user.repo.ts         # Database queries for users
│   └── batch.repo.ts        # Database queries for batches
├── services/
│   ├── file.service.ts      # File move/copy operations
│   └── jwt.service.ts       # Token generation/validation
└── utils/
    ├── db.ts                # PostgreSQL connection pool
    ├── redis.ts             # Redis client setup
    └── logger.ts            # Pino logger config
```

**Controller Template:**

```typescript
// services/api/src/controllers/documents.controller.ts
import { Request, Response } from 'express';
import { documentRepo } from '../repositories/document.repo';
import { fileService } from '../services/file.service';

export async function getDocument(req: Request, res: Response) {
  const { documentId } = req.params;
  const reviewToken = req.query.token as string;

  // Validate review token (alternative to Bearer auth)
  if (reviewToken) {
    const payload = jwtService.verifyReviewToken(reviewToken);
    if (payload.documentId !== documentId) {
      return res.status(403).json({ error: 'Invalid review token' });
    }
  } else if (!req.user) {
    // No review token and not authenticated
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const document = await documentRepo.findById(documentId);
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  res.json(document);
}

export async function approveDocument(req: Request, res: Response) {
  const { documentId } = req.params;
  const { destination_folder, filename } = req.body;

  const document = await documentRepo.findById(documentId);
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // Execute file move operation
  const destinationPath = await fileService.moveFile(
    document.scan_path,
    destination_folder,
    filename
  );

  // Update database
  await documentRepo.update(documentId, {
    status: 'filed',
    destination_path: destinationPath,
    user_action: 'approved',
    user_id: req.user.id,
  });

  res.json({
    message: 'Document filed successfully',
    destination: destinationPath,
  });
}
```

### Database Architecture

**Schema Design:**
(Refer to Database Schema section above for SQL DDL)

**Data Access Layer (Repository Pattern):**

```typescript
// services/api/src/repositories/document.repo.ts
import { pool } from '../utils/db';
import { Document, AnalysisResult } from '@ai-scanner/shared';

export const documentRepo = {
  async findById(id: string): Promise<Document | null> {
    const result = await pool.query('SELECT * FROM documents WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  async create(doc: Partial<Document>): Promise<Document> {
    const result = await pool.query(
      `INSERT INTO documents (filename, scan_path, scan_timestamp, status)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [doc.filename, doc.scan_path, doc.scan_timestamp, doc.status]
    );
    return result.rows[0];
  },

  async update(id: string, updates: Partial<Document>): Promise<void> {
    const fields = Object.keys(updates)
      .map((key, idx) => `${key} = $${idx + 2}`)
      .join(', ');
    const values = Object.values(updates);

    await pool.query(
      `UPDATE documents SET ${fields}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id, ...values]
    );
  },

  async findAnalyzedNotNotified(): Promise<Document[]> {
    const result = await pool.query(
      `SELECT * FROM documents
       WHERE status = 'analyzed' AND notified = false
       ORDER BY scan_timestamp ASC`
    );
    return result.rows;
  },
};
```

**Database Connection Pool:**

```typescript
// services/api/src/utils/db.ts
import { Pool } from 'pg';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database error');
  process.exit(-1); // Restart container on DB connection loss
});

// Health check function
export async function checkDbHealth(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (err) {
    logger.error({ err }, 'Database health check failed');
    return false;
  }
}
```

### Authentication and Authorization

**Auth Flow:**

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant API
    participant DB
    participant Redis

    User->>Browser: Enter credentials
    Browser->>API: POST /auth/login {username, password}
    API->>DB: SELECT user WHERE username=?
    DB-->>API: Return user with password_hash
    API->>API: bcrypt.compare(password, hash)

    alt Valid credentials
        API->>API: Generate JWT (RS256, 24h expiration)
        API-->>Browser: 200 OK {token, user}
        Browser->>Browser: Store token in localStorage
        Browser->>API: GET /api/documents/123 (Authorization: Bearer {token})
        API->>API: Verify JWT signature with public key
        API->>API: Check expiration (exp claim)
        API->>Redis: Check if token blacklisted (optional)
        Redis-->>API: Not blacklisted
        API-->>Browser: 200 OK {document}
    else Invalid credentials
        API-->>Browser: 401 Unauthorized
    end
```

**Middleware/Guards (JWT Validation):**

```typescript
// services/api/src/middleware/auth.middleware.ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const PUBLIC_KEY = process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n');

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid token' },
    });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  try {
    const payload = jwt.verify(token, PUBLIC_KEY, { algorithms: ['RS256'] });
    req.user = payload; // Attach user to request object
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: { code: 'TOKEN_EXPIRED', message: 'Token has expired' },
      });
    }
    return res.status(401).json({
      error: { code: 'INVALID_TOKEN', message: 'Invalid token signature' },
    });
  }
}

// Usage in routes:
// routes/documents.routes.ts
import { authMiddleware } from '../middleware/auth.middleware';

router.get('/api/documents/:id', authMiddleware, documentsController.getDocument);
router.post('/api/documents/:id/approve', authMiddleware, documentsController.approveDocument);
```

**Password Hashing (bcrypt):**

```typescript
// services/api/src/controllers/auth.controller.ts
import bcrypt from 'bcrypt';
import { userRepo } from '../repositories/user.repo';
import { jwtService } from '../services/jwt.service';

export async function register(req: Request, res: Response) {
  const { username, password } = req.body;

  // Validate password strength (min 8 chars)
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  // Hash password with bcrypt (10 rounds)
  const password_hash = await bcrypt.hash(password, 10);

  // Create user
  const user = await userRepo.create({ username, password_hash });

  // Generate JWT for immediate login
  const token = jwtService.generateToken({ user_id: user.id, username: user.username });

  res.status(201).json({ token, user: { id: user.id, username: user.username } });
}

export async function login(req: Request, res: Response) {
  const { username, password } = req.body;

  const user = await userRepo.findByUsername(username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = jwtService.generateToken({ user_id: user.id, username: user.username });

  res.json({ token, user: { id: user.id, username: user.username } });
}
```

---

## Unified Project Structure

```plaintext
ai.scanner/
├── .github/                      # CI/CD workflows
│   └── workflows/
│       ├── ci.yaml              # Run tests on push
│       └── deploy.yaml          # Build Docker images, push to Docker Hub
├── apps/                         # Application packages (none for MVP—services/ used instead)
├── services/                     # Backend service packages
│   ├── watcher/                 # File system polling service
│   │   ├── src/
│   │   │   ├── index.ts         # Service entry point
│   │   │   ├── poller.ts        # File polling logic
│   │   │   ├── stability.ts     # File stability checker
│   │   │   └── health.ts        # Health check endpoint
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── worker/                  # AI analysis worker
│   │   ├── src/
│   │   │   ├── index.ts         # Service entry point
│   │   │   ├── consumer.ts      # Queue job consumer
│   │   │   ├── data-loader.ts   # Load PO logs, vendor lists
│   │   │   ├── gemini.ts        # Gemini API client
│   │   │   ├── parser.ts        # Response validator
│   │   │   └── health.ts
│   │   ├── prompts/
│   │   │   ├── analysis-prompt.txt
│   │   │   └── analysis-prompt-large.txt
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── api/                     # Express REST API
│   │   ├── src/
│   │   │   ├── index.ts         # Express app setup
│   │   │   ├── routes/          # Route definitions
│   │   │   ├── controllers/     # Request handlers
│   │   │   ├── middleware/      # Auth, error, logging
│   │   │   ├── repositories/    # Database queries
│   │   │   ├── services/        # Business logic
│   │   │   └── utils/           # DB pool, Redis, logger
│   │   ├── migrations/          # Database migrations (node-pg-migrate)
│   │   │   ├── 001_initial_schema.sql
│   │   │   └── 002_add_indexes.sql
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── mailer/                  # Email notification service
│       ├── src/
│       │   ├── index.ts
│       │   ├── batch-poller.ts  # Poll DB for analyzed docs
│       │   ├── email-generator.ts
│       │   ├── smtp-client.ts
│       │   └── health.ts
│       ├── templates/
│       │   └── batch-summary.html  # Handlebars email template
│       ├── Dockerfile
│       ├── package.json
│       └── tsconfig.json
├── frontend/                     # Web UI (static assets)
│   ├── index.html               # SPA entry point
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── app.js               # Main app, router
│   │   ├── api/                 # API client modules
│   │   ├── components/          # UI components
│   │   ├── pages/               # Page modules
│   │   └── utils/               # Auth, router, DOM helpers
│   └── assets/
│       └── icons/               # SVG icons
├── shared/                       # Shared TypeScript types and utilities
│   ├── src/
│   │   ├── types/               # Interface definitions
│   │   ├── utils/               # Shared functions (filename sanitization, etc.)
│   │   └── constants/           # Enums, error codes
│   ├── package.json
│   └── tsconfig.json
├── infrastructure/               # IaC definitions (none for MVP—Docker Compose only)
├── docker/                       # Docker Compose configs
│   ├── docker-compose.yml       # Main compose file
│   ├── docker-compose.dev.yml   # Development overrides
│   └── docker-compose.prod.yml  # Production overrides
├── scripts/                      # Build/deploy scripts
│   ├── validate-env.js          # Check .env for missing vars
│   ├── load-examples.sh         # Copy sample data to configured paths
│   └── generate-keys.sh         # Generate JWT RSA key pair
├── docs/                         # Documentation
│   ├── prd.md                   # Product Requirements
│   ├── front-end-spec.md        # UI/UX Specification
│   ├── architecture.md          # This document
│   ├── setup-linux.md           # Linux deployment guide
│   ├── setup-windows.md         # Windows deployment guide
│   ├── setup-macos.md           # macOS deployment guide
│   └── troubleshooting.md       # Common issues
├── examples/                     # Sample data sources for testing
│   ├── sample-po-logs.csv
│   ├── sample-vendor-list.csv
│   ├── sample-folder-structure.json
│   └── test-documents/          # Sample PDFs/images
├── tests/                        # Test suites (none for MVP—deferred to post-MVP)
├── .env.example                  # Environment template
├── .gitignore                    # Git ignore rules
├── package.json                  # Root package.json (npm workspaces)
├── tsconfig.json                 # Root TypeScript config
├── README.md                     # Project overview, quick start
└── LICENSE                       # Open-source license (MIT)
```

**Notes:**

- Services use TypeScript transpiled to JavaScript at runtime via `tsx` (development) or `esbuild` (production)
- Frontend uses vanilla JavaScript (ES2022 modules) with no build step for MVP (future: bundle with esbuild)
- Shared package enables type sharing between frontend/backend (e.g., `import { Document } from '@ai-scanner/shared'`)
- Docker Compose orchestrates all services with single `docker-compose up` command
- Migrations run automatically on API service startup (ensures schema up-to-date before serving requests)

---

## Development Workflow

### Local Development Setup

**Prerequisites:**

```bash
# Install required tools
# Node.js v24.5.0 (use nvm for version management)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 24.5.0
nvm use 24.5.0

# Docker 20+ and Docker Compose 2.0+
# Linux: Follow official Docker docs
# macOS: Install Docker Desktop
# Windows: Install Docker Desktop with WSL2 backend

# Verify installations
node --version  # Should output v24.5.0
docker --version
docker-compose --version
```

**Initial Setup:**

```bash
# Clone repository
git clone https://github.com/yourusername/ai.scanner.git
cd ai.scanner

# Install dependencies (npm workspaces)
npm install

# Copy environment template
cp .env.example .env

# Generate JWT RSA key pair
./scripts/generate-keys.sh

# Edit .env file with your configuration
# - Add Gemini API key (get from https://ai.google.dev/)
# - Configure SMTP settings (Gmail, SendGrid, or local relay)
# - Set folder paths (scan folder, output folders)
nano .env

# Validate environment variables
npm run validate-env

# Start infrastructure (PostgreSQL, Redis)
docker-compose up -d postgres redis

# Run database migrations
cd services/api
npm run migrate:up
cd ../..

# Load sample data for testing
./scripts/load-examples.sh
```

**Development Commands:**

```bash
# Start all services in development mode (with hot reload)
npm run dev

# Start frontend only (served by API in dev mode)
cd services/api
npm run dev

# Start backend services individually
cd services/watcher && npm run dev   # File watcher
cd services/worker && npm run dev    # Analysis worker
cd services/api && npm run dev       # Express API
cd services/mailer && npm run dev    # Email service

# Run tests
npm run test                # All tests (all services)
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests
cd services/api && npm test # API tests only

# Linting and formatting
npm run lint                # ESLint check
npm run format              # Prettier format
```

### Environment Configuration

**Required Environment Variables:**

```bash
# Frontend (.env.local - not needed for MVP, frontend uses runtime config from API)
# N/A for MVP

# Backend (.env - shared by all services)

# === Database ===
DATABASE_URL=postgresql://ai_scanner:password@localhost:5432/ai_scanner

# === Redis ===
REDIS_URL=redis://localhost:6379

# === API Service ===
PORT=3000
JWT_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
JWT_PUBLIC_KEY="-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----"
REVIEW_TOKEN_SECRET=random_secret_key_here_32_chars
ALLOWED_ORIGINS=http://localhost:3000
WEB_UI_BASE_URL=http://localhost:3000

# === File Watcher ===
SCAN_FOLDER_PATH=/mnt/scan-folder
POLL_INTERVAL_MS=3000
FILE_STABILITY_TIMEOUT_MS=6000
SUPPORTED_EXTENSIONS=.pdf,.png,.jpg,.jpeg,.tiff

# === Worker Service ===
GEMINI_API_KEY=your_google_ai_api_key_here
GEMINI_MODEL=gemini-1.5-flash
GEMINI_RATE_LIMIT_RPM=15
PO_LOGS_PATH=/app/data/sample-po-logs.csv
VENDOR_LIST_PATH=/app/data/sample-vendor-list.csv
FOLDER_STRUCTURE_PATH=/app/data/sample-folder-structure.json

# === Mailer Service ===
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM=ai-scanner@yourdomain.com
NOTIFICATION_EMAIL=recipient@example.com
BATCH_IDLE_TIMEOUT_MS=15000

# === Output Folders ===
OUTPUT_FOLDER_BASE=/mnt/output-folders
REJECTED_FOLDER_PATH=/mnt/output-folders/manual-review

# === Logging ===
LOG_LEVEL=info  # debug, info, warn, error

# === Shared ===
NODE_ENV=development  # development, production
TZ=UTC  # Timezone for timestamps
```

**Notes:**

- Generate JWT keys with `./scripts/generate-keys.sh` (uses `openssl` to create RSA key pair)
- SMTP password for Gmail requires "App Password" (not regular password)—enable 2FA then generate at https://myaccount.google.com/apppasswords
- Folder paths use host file system paths (Docker volumes mount these into containers)
- For Windows, use forward slashes in paths: `C:/Users/yourname/Documents/scan-folder` (Docker translates automatically)

---

## Deployment Architecture

### Deployment Strategy

**Frontend Deployment:**

- **Platform:** Static files served by Express API (same container, no separate CDN for MVP)
- **Build Command:** `npm run build:frontend` (bundles JS/CSS with esbuild, outputs to `frontend/dist/`)
- **Output Directory:** `frontend/dist/` (served via `express.static('frontend/dist')`)
- **CDN/Edge:** None for MVP (future: Cloudflare CDN for global users)

**Backend Deployment:**

- **Platform:** Docker Compose on self-hosted Linux VM (AWS EC2, DigitalOcean, Azure VM, or on-premises server)
- **Build Command:** `docker-compose build` (builds Docker images for all services)
- **Deployment Method:** `docker-compose up -d` (detached mode, services run in background)

**Rationale:** Docker Compose simplifies deployment to single-command `docker-compose up`. No Kubernetes needed for MVP (<100 docs/day load). Self-hosted approach keeps documents on-premises for compliance. Frontend served by API eliminates CORS complexity and extra hosting costs.

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yaml
name: CI Pipeline

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '24.5.0'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379

      - name: Build Docker images
        run: docker-compose build

      - name: Push to Docker Hub
        if: github.ref == 'refs/heads/main'
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          docker-compose push
```

**Deployment Workflow:**

1. Developer pushes code to `dev` branch
2. GitHub Actions runs tests and linter
3. If tests pass, merge to `main` branch
4. GitHub Actions builds Docker images and pushes to Docker Hub
5. SSH into production server, run `docker-compose pull && docker-compose up -d --no-deps --build` to update services

**For MVP:** Manual deployment acceptable (SSH to server, `git pull`, `docker-compose up -d --build`). CI/CD can be added post-MVP.

### Environments

| Environment | Frontend URL                     | Backend URL                      | Purpose                                                    |
| ----------- | -------------------------------- | -------------------------------- | ---------------------------------------------------------- |
| Development | http://localhost:3000            | http://localhost:3000            | Local development (hot reload, debug logs)                 |
| Staging     | https://staging.ai-scanner.local | https://staging.ai-scanner.local | Pre-production testing (production-like config, test data) |
| Production  | https://ai-scanner.local         | https://ai-scanner.local         | Live environment (real documents, on-premises deployment)  |

**Environment-Specific Configuration:**

- **Development:** Uses `.env.development` (debug logs, hot reload, sample data)
- **Staging:** Uses `.env.staging` (production Docker images, test SMTP server, staging database)
- **Production:** Uses `.env.production` (production SMTP, real folder mounts, optimized logging)

**Deployment Hosts:**

- Development: Developer's laptop (Docker Desktop)
- Staging: Cloud VM or on-premises test server (e.g., AWS EC2 t3.medium, 2 vCPU, 4GB RAM)
- Production: On-premises server or cloud VM in customer's region (e.g., DigitalOcean Droplet, 4GB RAM, 80GB SSD)

---

## Security and Performance

### Security Requirements

**Frontend Security:**

- **CSP Headers:** `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;` (blocks XSS via inline scripts, allows data URIs for email thumbnails)
- **XSS Prevention:** All user input sanitized before rendering (use `textContent` instead of `innerHTML`, escape HTML entities in filenames)
- **Secure Storage:** JWT tokens stored in `localStorage` (alternative: `httpOnly` cookies for CSRF protection, but complicates frontend auth flow)

**Backend Security:**

- **Input Validation:** All API endpoints validate request bodies with JSON schema (joi or zod library), reject invalid input with 400 error
- **Rate Limiting:** API endpoints limited to 100 requests/minute per IP (express-rate-limit middleware), Gemini API limited to 15 requests/minute (internal token bucket)
- **CORS Policy:** `Access-Control-Allow-Origin: https://ai-scanner.local` (production), `http://localhost:3000` (development), no wildcard `*` allowed

**Authentication Security:**

- **Token Storage:** JWT in localStorage (frontend), never expose in URLs (use POST body or headers only)
- **Session Management:** 24-hour token expiration, no automatic refresh (user re-authenticates after expiration)
- **Password Policy:** Minimum 8 characters (configurable via env), bcrypt hashing with 10 rounds, no complexity requirements for MVP (future: add uppercase/number/symbol rules)

**File System Security:**

- **Path Validation:** All file paths validated against whitelist (scan folder, output folders), reject `../` traversal attempts
- **Permission Checks:** File operations fail gracefully if permissions denied, log ERROR with actionable message ("Check folder permissions: `chmod 755 /mnt/output-folders`")

### Performance Optimization

**Frontend Performance:**

- **Bundle Size Target:** <100KB total (JS + CSS), achieve via vanilla JS (no React), minimal dependencies, tree-shaking with esbuild
- **Loading Strategy:** Lazy-load document preview (fetch image only when in viewport), inline critical CSS (<5KB), async load non-critical JS
- **Caching Strategy:** Service worker for offline support (future), browser cache headers for static assets (1 year: `Cache-Control: public, max-age=31536000`), ETags for document previews

**Backend Performance:**

- **Response Time Target:** <100ms for API endpoints (excluding file I/O), <500ms for approval action (including file move), <5s for Gemini API call
- **Database Optimization:** Index on `documents.status` and `documents.notified` (partial index for email query), connection pooling (max 20 connections), query result caching in Redis (5-minute TTL)
- **Caching Strategy:** Redis cache for user sessions (30-minute TTL), document metadata (5-minute TTL), folder structure (1-hour TTL), Gemini rate limit counters (1-minute rolling window)

**Concurrency:**

- Worker service can scale to multiple instances (each consumes from shared Redis queue atomically)
- API service stateless (can run multiple instances behind load balancer—future)
- Database connection pooling prevents connection exhaustion (max 20 connections, queue requests if pool full)

**Resource Limits (Docker):**

```yaml
# docker-compose.yml excerpt
services:
  worker:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

---

## Testing Strategy

### Testing Pyramid

```
      E2E Tests (Manual)
      /                \
  Integration Tests (Vitest)
  /                          \
Frontend Unit Tests     Backend Unit Tests
    (Vitest)                (Vitest)
```

**Distribution:**

- **Unit Tests:** 70% of test effort (fast, isolated, test business logic)
- **Integration Tests:** 25% (test service interactions, database queries, API endpoints)
- **E2E Tests:** 5% (manual testing of critical workflows, browser automation deferred to post-MVP)

### Test Organization

**Frontend Tests:**

```
frontend/tests/
├── unit/
│   ├── utils/
│   │   ├── auth.test.js         # Test token validation
│   │   └── router.test.js       # Test route matching
│   ├── components/
│   │   ├── Button.test.js
│   │   └── Badge.test.js
│   └── api/
│       └── client.test.js       # Test fetch wrapper, error handling
└── integration/
    └── pages/
        └── ReviewPage.test.js   # Test page rendering with mock API
```

**Backend Tests:**

```
services/api/tests/
├── unit/
│   ├── repositories/
│   │   └── document.repo.test.ts  # Test SQL queries with mock DB
│   ├── services/
│   │   ├── file.service.test.ts   # Test file operations with temp files
│   │   └── jwt.service.test.ts    # Test token generation/validation
│   └── utils/
│       └── filename.test.ts       # Test sanitization logic
└── integration/
    ├── auth.integration.test.ts   # Test POST /auth/login flow
    ├── documents.integration.test.ts  # Test GET/POST /api/documents/*
    └── health.integration.test.ts     # Test /health endpoints
```

**E2E Tests (Manual Checklist):**

```
tests/e2e/
└── manual-checklist.md            # Step-by-step manual test cases
```

### Test Examples

**Frontend Component Test:**

```javascript
// frontend/tests/unit/components/Button.test.js
import { describe, it, expect } from 'vitest';
import { Button } from '../../../js/components/Button.js';

describe('Button Component', () => {
  it('renders with correct text', () => {
    const button = new Button({ text: 'Click Me', variant: 'primary' });
    const element = button.render();

    expect(element.textContent).toBe('Click Me');
    expect(element.className).toContain('btn-primary');
  });

  it('shows loading state', () => {
    const button = new Button({ text: 'Submit', loading: true });
    const element = button.render();

    expect(element.textContent).toBe('Loading...');
    expect(element.disabled).toBe(true);
  });

  it('calls onClick handler', () => {
    let clicked = false;
    const button = new Button({
      text: 'Test',
      onClick: () => {
        clicked = true;
      },
    });
    const element = button.render();

    element.click();
    expect(clicked).toBe(true);
  });
});
```

**Backend API Test:**

```typescript
// services/api/tests/integration/documents.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index';
import { pool } from '../../src/utils/db';

describe('Document API', () => {
  let authToken: string;
  let documentId: string;

  beforeAll(async () => {
    // Create test user and get auth token
    const res = await request(app)
      .post('/auth/register')
      .send({ username: 'testuser', password: 'password123' });
    authToken = res.body.token;

    // Create test document
    const doc = await pool.query(
      `INSERT INTO documents (filename, scan_path, scan_timestamp, status)
       VALUES ('test.pdf', '/scan/test.pdf', NOW(), 'analyzed')
       RETURNING id`
    );
    documentId = doc.rows[0].id;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM documents WHERE filename = $1', ['test.pdf']);
    await pool.query('DELETE FROM users WHERE username = $1', ['testuser']);
  });

  it('GET /api/documents/:id returns document', async () => {
    const res = await request(app)
      .get(`/api/documents/${documentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.id).toBe(documentId);
    expect(res.body.filename).toBe('test.pdf');
  });

  it('POST /api/documents/:id/approve files document', async () => {
    const res = await request(app)
      .post(`/api/documents/${documentId}/approve`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        destination_folder: '/tmp/test-output',
        filename: 'approved-test.pdf',
      })
      .expect(200);

    expect(res.body.message).toContain('filed successfully');
  });

  it('Returns 401 without auth token', async () => {
    await request(app).get(`/api/documents/${documentId}`).expect(401);
  });
});
```

**E2E Test (Manual):**

```markdown
# Manual E2E Test Checklist

## Scenario: Document Approval Workflow

1. **Setup:**
   - [ ] Start all services: `docker-compose up -d`
   - [ ] Copy test document to scan folder: `cp examples/test-documents/invoice.pdf /mnt/scan-folder/`

2. **File Detection:**
   - [ ] Wait 10 seconds, check watcher logs: `docker-compose logs watcher | grep invoice.pdf`
   - [ ] Verify document in database: `psql -c "SELECT * FROM documents WHERE filename='invoice.pdf'"`

3. **AI Analysis:**
   - [ ] Wait 15 seconds for worker to process
   - [ ] Check worker logs for Gemini API call: `docker-compose logs worker | grep "Analysis complete"`
   - [ ] Verify status updated to 'analyzed': `psql -c "SELECT status FROM documents WHERE filename='invoice.pdf'"`

4. **Email Notification:**
   - [ ] Wait 15 seconds for batch trigger
   - [ ] Check email inbox for batch summary (should receive within 30s)
   - [ ] Verify email contains: document thumbnail, confidence score, review link

5. **Web Review:**
   - [ ] Click review link in email
   - [ ] Verify redirects to login page
   - [ ] Enter credentials (testuser / password123), submit
   - [ ] Verify document preview loads (PDF visible)
   - [ ] Verify AI analysis card shows confidence score, document type, reasoning
   - [ ] Verify recommended folder and filename pre-filled

6. **Approval:**
   - [ ] Click "Approve & File" button
   - [ ] Verify success message appears within 2 seconds
   - [ ] Verify redirect to success page
   - [ ] Check destination folder: `ls /mnt/output-folders/Quality/Suppliers/` (file should be moved)
   - [ ] Verify database status: `psql -c "SELECT status FROM documents WHERE filename='invoice.pdf'"` (should be 'filed')

7. **Cleanup:**
   - [ ] Delete test document from output folder
   - [ ] Reset database: `psql -c "DELETE FROM documents WHERE filename='invoice.pdf'"`

**Expected Duration:** 5-7 minutes
**Pass Criteria:** All steps complete without errors, file successfully moved to correct destination
```

---

## Coding Standards

### Critical Fullstack Rules

- **Type Sharing:** Always define types in `shared/src/types/` and import from `@ai-scanner/shared` in both frontend and backend. Never duplicate type definitions between packages.

- **API Calls:** Never make direct `fetch()` calls from frontend pages—use the service layer (`frontend/js/api/documents.js`). All API requests must go through `apiFetch()` wrapper for consistent error handling and auth token injection.

- **Environment Variables:** Access only through config objects (`config/env.js`), never use `process.env` directly in business logic. Validate all required env vars on service startup (fail fast if missing).

- **Error Handling:** All API routes must use the standard error handler middleware. Return structured errors: `{ error: { code, message, details, timestamp, requestId } }`. Never expose stack traces in production.

- **State Updates:** Never mutate state directly—use pure functions and immutable updates. For document status changes, always update database first, then return updated state to caller.

- **Database Queries:** All database access must go through repository layer (`repositories/*.repo.ts`). Never write raw SQL in controllers or services (exception: migrations).

- **File Path Validation:** All user-provided file paths (destination folders, filenames) must be validated against whitelist before file operations. Use `validateFolderPath()` from `@ai-scanner/shared/utils/paths`.

- **JWT Token Handling:** Never log JWT tokens (mask in logs with `logger.child({ token: '***' })`). Validate expiration on every protected route. Use short-lived review tokens (4h) for email links.

- **Async Error Handling:** All async functions must use try-catch blocks. Never throw unhandled promise rejections. Log errors with context: `logger.error({ err, documentId }, 'Failed to process document')`.

- **Input Sanitization:** All user input (filenames, folder paths, rejection notes) must be sanitized before storing in database or using in file operations. Use `sanitizeFilename()` from shared utils.

### Naming Conventions

| Element               | Frontend                    | Backend              | Example                                    |
| --------------------- | --------------------------- | -------------------- | ------------------------------------------ |
| Components            | PascalCase                  | -                    | `Button.js`, `DocumentPreview.js`          |
| Hooks                 | camelCase with 'use' prefix | -                    | `useAuth.js`, `useRouter.js`               |
| API Routes            | -                           | kebab-case           | `/api/documents/:id`, `/auth/login`        |
| Database Tables       | -                           | snake_case           | `documents`, `processing_queue`, `batches` |
| TypeScript Interfaces | PascalCase                  | PascalCase           | `Document`, `AnalysisResult`, `QueueJob`   |
| Functions             | camelCase                   | camelCase            | `approveDocument()`, `sanitizeFilename()`  |
| Constants             | SCREAMING_SNAKE_CASE        | SCREAMING_SNAKE_CASE | `MAX_RETRY_COUNT`, `DEFAULT_POLL_INTERVAL` |
| Environment Variables | SCREAMING_SNAKE_CASE        | SCREAMING_SNAKE_CASE | `GEMINI_API_KEY`, `SMTP_HOST`              |

**Additional Conventions:**

- **File Names:** Match primary export name (`Button.js` exports `Button` class, `document.repo.ts` exports `documentRepo`)
- **Test Files:** Same name as source file with `.test.` suffix (`Button.test.js`, `document.repo.test.ts`)
- **Async Functions:** Prefix with `async` keyword, return Promises (never mix callbacks and Promises)
- **Boolean Variables:** Prefix with `is`, `has`, `should` (`isAuthenticated`, `hasConfidence`, `shouldRetry`)
- **Event Handlers:** Prefix with `handle` (`handleApprove`, `handleReject`, `handleLogin`)

---

## Error Handling Strategy

### Error Flow

```mermaid
sequenceDiagram
    participant Frontend
    participant API
    participant Service
    participant Database
    participant ErrorHandler

    Frontend->>API: POST /api/documents/123/approve
    API->>Service: fileService.moveFile()

    alt File Operation Success
        Service->>Database: Update document status
        Database-->>Service: Success
        Service-->>API: Return destination path
        API-->>Frontend: 200 OK
    else File Operation Failure
        Service->>Service: Catch error
        Service->>ErrorHandler: Log error with context
        Service-->>API: Throw FileOperationError
        API->>ErrorHandler: Error middleware catches
        ErrorHandler->>ErrorHandler: Format error response
        ErrorHandler-->>Frontend: 500 Internal Server Error (JSON)
        Frontend->>Frontend: Show user-friendly error + retry button
    end
```

### Error Response Format

```typescript
// Standardized API error response
interface ApiError {
  error: {
    code: string;          // Machine-readable error code (e.g., "FILE_OPERATION_FAILED")
    message: string;       // Human-readable message (e.g., "Unable to move file")
    details?: Record<string, any>;  // Optional additional context
    timestamp: string;     // ISO 8601 timestamp
    requestId: string;     // UUID for request tracing
  };
}

// Example error response:
{
  "error": {
    "code": "FILE_OPERATION_FAILED",
    "message": "Unable to move file: Permission denied",
    "details": {
      "source": "/mnt/scan-folder/invoice.pdf",
      "destination": "/mnt/output/Quality/invoice.pdf",
      "errno": -13
    },
    "timestamp": "2025-10-03T14:30:52.123Z",
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Frontend Error Handling

```javascript
// frontend/js/api/client.js
export async function apiFetch(endpoint, options = {}) {
  try {
    const response = await fetch(API_BASE_URL + endpoint, options);

    if (!response.ok) {
      const error = await response.json();

      // Special handling for auth errors
      if (response.status === 401) {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
        throw new Error('Session expired');
      }

      // Throw structured error
      throw new ApiError(error.error.code, error.error.message, error.error.details);
    }

    return response.json();
  } catch (err) {
    // Network errors (fetch failed)
    if (!err.code) {
      throw new Error('Unable to connect. Please check your internet connection.');
    }
    throw err;
  }
}

// Custom error class
class ApiError extends Error {
  constructor(code, message, details) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

// Usage in ReviewPage.js:
async function handleApprove() {
  try {
    await approveDocument(documentId, { destination_folder, filename });
    showSuccessPage();
  } catch (err) {
    if (err.code === 'FILE_OPERATION_FAILED') {
      showError('Unable to file document. Please check folder permissions and try again.', {
        retry: () => handleApprove(), // Retry button
      });
    } else {
      showError('An unexpected error occurred. Please try again later.');
    }
    logger.error({ err, documentId }, 'Approval failed');
  }
}
```

### Backend Error Handling

```typescript
// services/api/src/middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  const requestId = uuidv4();

  // Log error with full context
  logger.error(
    {
      err,
      requestId,
      method: req.method,
      path: req.path,
      body: req.body,
      user: req.user?.id,
    },
    'Request error'
  );

  // Map errors to status codes
  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
  } else if (err.name === 'FileOperationError') {
    statusCode = 500;
    errorCode = 'FILE_OPERATION_FAILED';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    errorCode = 'NOT_FOUND';
  }

  // Send structured error response
  res.status(statusCode).json({
    error: {
      code: errorCode,
      message: err.message,
      details: err.details || {},
      timestamp: new Date().toISOString(),
      requestId,
    },
  });
}

// Custom error classes
export class FileOperationError extends Error {
  name = 'FileOperationError';
  details: Record<string, any>;

  constructor(message: string, details: Record<string, any>) {
    super(message);
    this.details = details;
  }
}

export class ValidationError extends Error {
  name = 'ValidationError';
  details: Record<string, any>;

  constructor(message: string, details: Record<string, any>) {
    super(message);
    this.details = details;
  }
}

// Usage in file.service.ts:
import { FileOperationError } from '../middleware/error.middleware';

export async function moveFile(source: string, destFolder: string, filename: string) {
  try {
    const dest = path.join(destFolder, filename);
    await fs.rename(source, dest);
    return dest;
  } catch (err) {
    throw new FileOperationError('Unable to move file: ' + err.message, {
      source,
      destination: path.join(destFolder, filename),
      errno: err.errno,
    });
  }
}
```

---

## Monitoring and Observability

### Monitoring Stack

- **Frontend Monitoring:** Browser console errors logged to backend via POST `/api/logs` endpoint (captures JS errors, failed API calls) - deferred to post-MVP
- **Backend Monitoring:** Pino structured JSON logs to stdout (Docker captures and aggregates via `docker-compose logs`)
- **Error Tracking:** Sentry integration for production error aggregation and alerting - deferred to post-MVP
- **Performance Monitoring:** Custom metrics exposed via GET `/metrics` endpoints (Prometheus-compatible format for future Grafana dashboards)

**MVP Monitoring:**

- Pino logs with severity levels (debug, info, warn, error)
- Health check endpoints (`/health`, `/health/db`, `/health/redis`) for uptime monitoring
- Manual log review: `docker-compose logs -f --tail=100 worker` (tail recent worker logs)

### Key Metrics

**Frontend Metrics:**

- **Core Web Vitals:** (measured via Chrome DevTools, manual review)
  - LCP (Largest Contentful Paint): <2.5s
  - FID (First Input Delay): <100ms
  - CLS (Cumulative Layout Shift): <0.1
- **JavaScript Errors:** Count of unhandled exceptions (logged to console, captured manually)
- **API Response Times:** Measure via Network tab (target: <500ms for document fetch, <100ms for auth)
- **User Interactions:** Manual testing (count clicks to approve, measure time from email to approval)

**Backend Metrics (Exposed via GET /metrics):**

```javascript
// Example metrics output (Prometheus format)
// GET /metrics response:

# HELP documents_processed_total Total documents processed by status
# TYPE documents_processed_total counter
documents_processed_total{status="queued"} 150
documents_processed_total{status="processing"} 5
documents_processed_total{status="analyzed"} 120
documents_processed_total{status="filed"} 100
documents_processed_total{status="rejected"} 15
documents_processed_total{status="failed"} 5

# HELP gemini_api_requests_total Total Gemini API requests
# TYPE gemini_api_requests_total counter
gemini_api_requests_total{status="success"} 115
gemini_api_requests_total{status="failure"} 5

# HELP gemini_api_latency_ms Gemini API response time in milliseconds
# TYPE gemini_api_latency_ms histogram
gemini_api_latency_ms_bucket{le="1000"} 50
gemini_api_latency_ms_bucket{le="3000"} 100
gemini_api_latency_ms_bucket{le="5000"} 115
gemini_api_latency_ms_bucket{le="+Inf"} 120
gemini_api_latency_ms_sum 180000
gemini_api_latency_ms_count 120

# HELP email_batches_sent_total Total email batches sent
# TYPE email_batches_sent_total counter
email_batches_sent_total{status="sent"} 25
email_batches_sent_total{status="failed"} 2

# HELP file_operations_total Total file operations (move/copy)
# TYPE file_operations_total counter
file_operations_total{operation="move",status="success"} 95
file_operations_total{operation="move",status="failure"} 5

# HELP api_request_duration_ms API request duration in milliseconds
# TYPE api_request_duration_ms histogram
api_request_duration_ms_bucket{method="GET",path="/api/documents/:id",le="100"} 800
api_request_duration_ms_bucket{method="POST",path="/api/documents/:id/approve",le="500"} 150
```

**Metric Collection Implementation:**

```typescript
// services/api/src/utils/metrics.ts
class Metrics {
  private counters = new Map<string, number>();
  private histograms = new Map<string, number[]>();

  incrementCounter(name: string, labels: Record<string, string> = {}) {
    const key = this.serializeKey(name, labels);
    this.counters.set(key, (this.counters.get(key) || 0) + 1);
  }

  recordHistogram(name: string, value: number, labels: Record<string, string> = {}) {
    const key = this.serializeKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
  }

  private serializeKey(name: string, labels: Record<string, string>) {
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${name}{${labelStr}}`;
  }

  toPrometheus(): string {
    // Format as Prometheus exposition format
    // (Implementation omitted for brevity)
  }
}

export const metrics = new Metrics();

// Usage in worker service:
import { metrics } from './utils/metrics';

const startTime = Date.now();
const result = await geminiClient.generateContent(prompt);
metrics.recordHistogram('gemini_api_latency_ms', Date.now() - startTime);
metrics.incrementCounter('gemini_api_requests_total', { status: 'success' });
```

**Health Monitoring:**

- Manual checks: `curl http://localhost:3000/health` (should return 200 OK)
- Automated uptime monitoring (post-MVP): UptimeRobot or Pingdom pinging `/health` every 5 minutes
- Alert on 3 consecutive failures (email to admin)

---

## Checklist Results Report

Before running the checklist, output the full architecture document for review.

**Architecture Checklist Validation:**

_(This section will be populated by running the architect-checklist.md against this document)_

**Preliminary Self-Assessment:**

✅ **Technical Summary:** Complete—covers architecture style, tech stack, integration points, infrastructure
✅ **Platform Selection:** Docker Compose on self-hosted infrastructure, rationale provided
✅ **Repository Structure:** Monorepo with npm workspaces, clear package organization
✅ **Architecture Diagrams:** High-level diagram and component interaction diagram included
✅ **Architectural Patterns:** 8 patterns documented (microservices, event-driven, polling, BFF, repository, optimistic UI, stateless, circuit breaker)
✅ **Tech Stack Table:** Complete with 20+ technologies, versions, purposes, and rationales
✅ **Data Models:** 4 core models (Document, User, ProcessingQueue, Batch) with TypeScript interfaces
✅ **API Specification:** OpenAPI 3.0 spec with 8 endpoints, authentication, error format
✅ **Components:** 5 backend services + shared package described (responsibility, interfaces, dependencies, tech stack)
✅ **External APIs:** Gemini Vision API documented (purpose, endpoints, authentication, rate limits, integration notes)
✅ **Core Workflows:** End-to-end sequence diagram with error handling paths
✅ **Database Schema:** PostgreSQL DDL with tables, indexes, triggers, design notes
✅ **Frontend Architecture:** Component organization, state management, routing, services layer
✅ **Backend Architecture:** Controller organization, repository pattern, auth flow
✅ **Project Structure:** Complete directory tree with explanations
✅ **Development Workflow:** Prerequisites, setup, dev commands, environment variables
✅ **Deployment Architecture:** Strategy, CI/CD pipeline, environments table
✅ **Security & Performance:** Requirements for frontend/backend, optimization strategies
✅ **Testing Strategy:** Pyramid, test organization, examples for frontend/backend/E2E
✅ **Coding Standards:** 10 critical rules, naming conventions table
✅ **Error Handling:** Error flow diagram, response format, frontend/backend examples
✅ **Monitoring:** Metrics stack, key metrics with Prometheus format

**Readiness for Development:** ✅ **READY**

This architecture provides comprehensive technical guidance for AI agent-driven fullstack development. All sections from the fullstack template are complete with project-specific details. The document is ready for handoff to development agents (dev, UX, QA).

---

_Architecture v1.0 - Created 2025-10-03 using BMAD-METHOD™ framework by Winston (Architect Agent)_
