# Technical Assumptions

## Repository Structure

**Monorepo**

Single repository containing all MVP components: backend services (file watcher, analysis worker, web API, email service), frontend web interface, Docker configuration, documentation, and example configs. Clear directory structure with separation of concerns:

```
ai.scanner/
├── services/
│   ├── watcher/      # Polling-based file monitor
│   ├── worker/       # Analysis queue consumer
│   ├── api/          # Express.js web API
│   └── mailer/       # Email batch service
├── frontend/         # Web review interface
├── shared/           # Shared utilities, types
├── docker/           # Docker Compose configs
├── docs/             # Setup guides, API docs
├── examples/         # Sample data sources (PO logs, vendor lists)
└── tests/            # Test suites
```

**Rationale:** Monorepo simplifies MVP development with single deployment unit, unified versioning (single package.json), and easier coordination between services. Node.js monorepo with shared workspace makes code reuse trivial.

## Service Architecture

**Modular Monolith within Docker Compose** (containerized microservices pattern with shared database)

- **File Watcher Service:** Continuous background process with polling-based file system monitoring of scan folder, writes to queue on file detection
- **Analysis Worker:** Queue consumer that processes documents via Gemini API, writes results to database
- **Web API Service:** Express.js REST endpoints for authentication, document retrieval, approval actions
- **Email Service:** Batch trigger scheduler that generates HTML emails and sends via SMTP
- **Shared PostgreSQL Database:** Central state for queue, document metadata, user sessions
- **Lightweight Queue:** Simple Redis-backed queue or in-memory queue (no heavyweight Celery/Bull MQ)

Each service runs in separate container, communicates via database and lightweight queue. Services can restart independently but share deployment lifecycle.

**Key Technology Choice:** **Node.js backend** (Node v24.5.0) for all services. Reasoning:

- Fast async I/O perfect for file watching, API calls, and concurrent request handling
- Lightweight and fast cold start (ideal for containerized services)
- Rich ecosystem: Express (web), simple queue libraries, pdf-parse/pdf-lib (PDF handling), sharp (image processing)
- Single language JavaScript for frontend and backend reduces context switching
- Excellent Gemini SDK support with official Google client library
- Trade-off: Less mature AI/ML ecosystem than Python, but Gemini API is REST-based so no major disadvantage

**Frontend:** Vanilla HTML/CSS/JavaScript with minimal framework (or lightweight Alpine.js/htmx for interactivity)—avoid React/Vue overhead for simple review form. Focus on fast load times and minimal dependencies.

## Testing Requirements

**Unit + Integration testing** (not full testing pyramid for MVP)

- **Unit tests:** Core logic (document classification, filename generation, confidence score calculation, file path validation)
- **Integration tests:** End-to-end workflow tests (file detected → queued → analyzed → email sent → approval → file moved)
- **Manual testing:** Browser compatibility, email rendering across clients, Docker deployment on Windows/Mac/Linux
- **No automated E2E UI tests:** Selenium/Playwright deferred to post-MVP (too much overhead for single-page interface)
- **No load testing:** Manual verification of 100 docs/day throughput sufficient for MVP

**Testing tools:**

- Jest or Vitest for JavaScript unit/integration tests
- Manual testing checklist for deployment validation
- Docker test environment matching production setup

**Coverage target:** 70%+ for core business logic, 50%+ overall (pragmatic for MVP, not dogmatic 100% coverage)

## Additional Technical Assumptions and Requests

- **File System Monitoring:** Polling-based approach using Node.js fs.watch or simple setInterval polling (every 2-5 seconds). Check directory for new files by comparing file list snapshots. More reliable across different file systems (NFS, SMB) than event-based watching which can miss events on network shares.

- **Queue Implementation:** Lightweight approach—use **BullMQ Lite** (Redis-backed, minimal overhead) OR simple in-memory queue with database persistence for reliability. No need for heavyweight Celery/RabbitMQ complexity. If Redis already in stack for caching, BullMQ Lite is natural fit. Otherwise, simple custom queue with PostgreSQL as persistence layer.

- **Email Service:** Use SMTP relay with Nodemailer library (battle-tested, supports all SMTP providers). Configurable settings support Gmail SMTP, SendGrid, AWS SES, or any standard SMTP server. No hard dependency on specific provider.

- **Network Folder Access:** Support both NFS (Linux) and SMB/CIFS (Windows) via mounted volumes in Docker. User mounts share on host, Docker accesses via volume binding. Document setup for each platform in README.

- **External Data Sources:** CSV and JSON file formats for PO logs, vendor lists, folder structure definitions. Simple file-based config avoids database setup complexity. Files refreshed on service restart or via API endpoint for dynamic updates. Use csv-parser and native JSON.parse in Node.js.

- **AI Model:** Gemini 1.5 Flash (fast, cheap) as primary model with Google's official Node.js client library (@google/generative-ai). Configure model via .env to allow swapping (Gemini Pro, future Claude/GPT support). Design abstraction layer for model-agnostic prompts.

- **Logging:** Structured JSON logs to stdout using pino (high-performance Node.js logger), configurable log level via .env. Post-MVP: integrate with Grafana/Prometheus for monitoring.

- **Security:** JWT tokens with RS256 signing using jsonwebtoken library (public/private key pair). Secrets managed via .env file with clear documentation on generation. HTTPS via self-signed cert (instructions provided) or reverse proxy (Nginx/Traefik) for production deployments.

- **Database Access:** Use node-postgres (pg) library for PostgreSQL connection pooling. Simple query builder or raw SQL (avoid heavy ORM like TypeORM for MVP). Database migrations using node-pg-migrate (lightweight, SQL-based).

- **API Rate Limiting:** Implement basic rate limiting for Gemini API (15 req/min free tier) using simple token bucket algorithm in memory or Redis. Fail gracefully with queued retry if rate exceeded.

- **File Lock Handling:** Polling approach helps with lock detection—if file size changes between polls, scanner still writing. Wait until file size stable for 2+ poll cycles before processing. Retry logic: 3 attempts with exponential backoff (1s, 2s, 4s) before marking as error.

- **Document Retention:** Keep processed document metadata in database for 30 days (configurable), then auto-purge with scheduled cleanup job (node-cron). Physical files managed by user (system only moves/copies, doesn't delete).

- **Gemini Prompt Engineering:** Include prompt templates in repo as separate .txt or .json files (not hardcoded strings). Allow prompt customization for advanced users without code changes.

- **Error Handling:** Graceful degradation—if Gemini API fails, queue document for retry (max 3 attempts). If all retries fail, send error notification email with manual fallback instructions. Use async/await with try-catch throughout.

- **Timezone Handling:** All timestamps in UTC internally (using date-fns or native Date), display in user's local timezone (configured via .env or browser detection).

---
