# High Level Architecture

## Technical Summary

ai.scanner implements a **containerized microservices architecture** deployed via Docker Compose, combining Node.js backend services with a lightweight vanilla JavaScript frontend. The system uses **event-driven asynchronous processing** with a Redis-backed queue to handle document ingestion from file system polling through AI analysis to user approval workflows. Backend services (file watcher, analysis worker, API, email service) communicate via PostgreSQL database and Redis pub/sub, while the **Express.js REST API** serves as the integration point for the browser-based review interface. Infrastructure runs on Docker containers orchestrated locally or on Linux/Windows/macOS hosts with mounted network folders for document access. This architecture achieves the PRD's goals of <15 second processing time through parallel worker processing, 90% time savings via AI-powered routing recommendations, and cross-platform deployment via containerization.

## Platform and Infrastructure Choice

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

## Repository Structure

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

## High Level Architecture Diagram

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

## Architectural Patterns

- **Microservices with Shared Database:** Each service runs independently in separate container but shares PostgreSQL for state coordination. Simpler than service-per-database pattern for MVP; acceptable given low write contention.

- **Event-Driven Queue Processing:** File detection triggers queue jobs consumed asynchronously by worker. Decouples ingestion from analysis for resilience (worker crashes don't affect file watching).

- **Polling-Based File Monitoring:** File watcher uses periodic polling (3-second intervals) instead of inotify/fs.watch events. More reliable across network shares (NFS/SMB) where event-based watching misses events.

- **Backend-for-Frontend (BFF) Pattern:** Express API serves dual purpose—REST endpoints for frontend AND static file hosting. Simplifies deployment (single origin, no CORS complexity) and authentication (session cookies work seamlessly).

- **Repository Pattern (Data Access Layer):** Database queries abstracted behind repository modules (`documentRepo.js`, `userRepo.js`). Enables testing with mock repositories and potential database migration (PostgreSQL → MySQL) without changing business logic.

- **Optimistic UI with Background Processing:** Frontend shows immediate success confirmation after approval action, while file operation executes asynchronously. Improves perceived performance (user sees <100ms response) while actual file I/O may take 1-5 seconds.

- **Stateless Service Design:** All services are stateless (state lives in PostgreSQL/Redis). Enables horizontal scaling (run multiple worker containers) and simplifies restart recovery.

- **Circuit Breaker for External APIs:** Gemini API calls wrapped in circuit breaker pattern (after 3 consecutive failures, pause requests for 60 seconds). Prevents cascading failures if Gemini is temporarily unavailable.

---
