# ai.scanner Product Requirements Document (PRD)

**Version:** 1.0
**Date:** 2025-10-03
**Author:** John (PM Agent)
**Project:** ai.scanner - AI-Powered Document Routing System

---

## Goals and Background Context

### Goals

- Reduce document filing time from 2-5 minutes per document to <30 seconds of review time (90% time savings)
- Achieve 85%+ correct-on-first-recommendation rate for AI routing suggestions within first 50 documents
- Enable non-technical users to install and configure system in <15 minutes
- Support processing 10+ documents/day with <15 second processing time from scan to email notification
- Maintain zero data loss or file corruption during continuous 7+ day operation
- Build trust through transparency with confidence scores and human-in-the-loop approval workflow
- Release as open-source solution achieving 10+ organizational adoptions within 3 months

### Background Context

Organizations with structured filing requirements (ISO QMS, HIPAA medical records, financial compliance) face a daily productivity drain from manual document routing. Each scanned document requires 2-5 minutes of manual work: identifying document type, extracting key information (vendor, PO number, dates), navigating complex folder structures, and applying naming conventions. This creates 30+ minutes of non-value-add work daily for even modest 10-document volumes, while introducing compliance risks from human filing errors.

**ai.scanner** addresses this through an AI-powered reasoning engine that doesn't just classify documents—it *reasons* about them. By consulting external data sources (PO logs, vendor lists, folder structures), the system fills information gaps and makes intelligent routing recommendations with confidence scores. A batch processing UX (15-second idle trigger) provides single-email summaries with web-based review interfaces, allowing users to approve recommendations in 10-15 seconds per document. Built for Docker Compose deployment with .env configuration, the system targets small-to-medium businesses (QMS manufacturing, medical practices, legal/accounting firms) who need intelligent document management without enterprise DMS costs.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-10-03 | 1.0 | Initial PRD creation | John (PM Agent) |

---

## Requirements

### Functional Requirements

**FR1:** System SHALL monitor a configured network folder path for new PDF and image files (PNG, JPEG, TIFF), detecting file creation events in real-time

**FR2:** System SHALL trigger AI analysis pipeline when new file is detected, queuing document for batch processing

**FR3:** System SHALL implement 15-second idle trigger that sends batch summary email after 15 seconds of no new scan activity

**FR4:** System SHALL extract text from documents using OCR and send both image and text to Gemini Vision API for multimodal analysis

**FR5:** System SHALL provide Gemini API with external data sources (PO logs CSV, vendor lists CSV, folder structure JSON) as context for reasoning

**FR6:** System SHALL receive structured output from Gemini containing: document type classification, extracted key fields (vendor, PO#, date, etc.), recommended folder path, recommended filename, confidence score (0-100%), and reasoning explanation

**FR7:** System SHALL detect documents with 50+ pages and process only first 5 pages, providing page count context to AI model

**FR8:** System SHALL generate HTML email summary containing: list of pending documents, thumbnail images, AI recommendations, confidence scores, and unique web links to review interface for each document

**FR9:** System SHALL provide web review interface displaying: document preview (scrollable full PDF/image), AI analysis digest, recommended destination folder path, editable filename field, confidence score, and approve/reject buttons

**FR10:** System SHALL require user authentication to access web review interface using JWT session tokens

**FR11:** System SHALL allow users to edit recommended filename and folder path before approval

**FR12:** System SHALL execute file operation (move or copy) from scan folder to user-approved destination with user-confirmed filename only after explicit approval action

**FR13:** System SHALL provide clear indication of proposed file operation before execution, showing source and destination paths

**FR14:** System SHALL update document status in queue after successful file operation, preventing duplicate processing

**FR15:** System SHALL handle network folder access for both Linux NFS and Windows SMB/CIFS shares

**FR16:** System SHALL log all processing activities (file detected, analysis started, analysis completed, user action, file operation result) with timestamps

**FR17:** System SHALL handle authentication via username/password login with JWT session management

**FR18:** System SHALL support configuration via .env file for: monitored folder path, output folder paths, email SMTP settings, Gemini API key, authentication secrets, external data source paths

**FR19:** System SHALL provide Docker Compose deployment with single-command startup including: application container, PostgreSQL database, and queue system (Redis or equivalent)

**FR20:** System SHALL maintain processing queue in database with document metadata: filename, scan timestamp, analysis status, AI recommendations, user actions, final destination

### Non-Functional Requirements

**NFR1:** System SHALL complete AI analysis for single-page document in <5 seconds and 50-page document in <15 seconds

**NFR2:** System SHALL support processing throughput of 100+ documents per day

**NFR3:** System SHALL run continuously for 7+ days without requiring restart or manual intervention

**NFR4:** System SHALL maintain zero data loss—no documents lost or corrupted during processing

**NFR5:** Web review interface SHALL be responsive and functional on tablet devices (iPad, Android tablets)

**NFR6:** System SHALL support modern evergreen browsers (Chrome, Firefox, Safari, Edge) for web interface

**NFR7:** System SHALL use HTTPS for web interface with self-signed certificate acceptable for MVP

**NFR8:** System SHALL implement session timeout for inactive users (configurable, default 30 minutes)

**NFR9:** System SHALL validate file system permissions before attempting file operations, providing clear error messages on failure

**NFR10:** System SHALL store API keys and authentication secrets securely via environment variables, never committed to source control

**NFR11:** System SHALL NOT store document content in database (privacy/compliance consideration)—only metadata and file paths

**NFR12:** Gemini API usage SHALL aim to stay within free tier limits (15 requests/minute) with rate limiting implemented

**NFR13:** System SHALL provide installation and configuration documentation enabling non-technical users to complete setup in <15 minutes

**NFR14:** System SHALL handle file lock detection and implement retry logic for files being written by scanner

**NFR15:** System SHALL be deployable on Linux (primary), Windows (via Docker Desktop), and macOS (via Docker Desktop)

---

## User Interface Design Goals

### Overall UX Vision

The interface should feel **invisible and trustworthy**—users spend minimal time reviewing AI recommendations before confidently approving. Visual design emphasizes clarity over aesthetics: large document previews, prominent confidence scores with color-coding (green >80%, yellow 60-80%, red <60%), and single-action approval workflow. The experience should feel like "reviewing a colleague's work" rather than "operating software"—conversational language, transparent reasoning explanations, and forgiving error handling.

**Key design principle:** Trust through transparency. Every AI decision is explained, every file operation is previewed before execution, and users maintain full control with easy editing.

### Key Interaction Paradigms

- **Email as entry point**: Users receive batch summary email, click document-specific link to web review interface (no dashboard navigation required)
- **Single-page review flow**: Each document gets dedicated review page with all information visible without scrolling (on desktop)—no tabs, modals, or multi-step wizards
- **Keyboard-friendly**: Power users can approve/reject with hotkeys (Enter to approve, Esc to reject, Tab to edit fields)
- **Mobile-friendly fallback**: Touch-optimized buttons, swipe-to-preview on tablets, responsive layout down to 768px width
- **Optimistic UI**: Approval action shows immediate success state while file operation executes in background, with notification if operation fails

### Core Screens and Views

1. **Login Screen** (username/password form, minimal branding, "Remember me" checkbox)
2. **Document Review Page** (primary interface—document preview, AI analysis card, approval controls)
3. **Success Confirmation** (brief "Document filed successfully" message with auto-redirect to email for next document)
4. **Error/Rejection Handling** (simple form to mark document for manual handling with optional note field)

### Accessibility

**WCAG AA compliance** (minimum standard for business applications)

- Color contrast ratios meet 4.5:1 for text
- Keyboard navigation for all interactive elements
- Alt text for document thumbnails/previews
- Focus indicators on all controls
- Screen reader labels for form fields

### Branding

**Minimal, professional, tool-focused aesthetic**

- Neutral color palette (grays, blues) with semantic colors for confidence scores (green/yellow/red)
- Sans-serif font (system fonts for performance—Arial, Helvetica, Roboto fallback)
- Simple logo/wordmark: "ai.scanner" in clean typography
- No elaborate illustrations or marketing imagery—focus on document content

### Target Device and Platforms

**Web Responsive** (desktop-first, tablet-optimized, mobile-functional)

- **Primary target:** Desktop browsers (1920×1080, 1440×900 common)
- **Secondary target:** Tablets (iPad, Android tablets) in landscape orientation (1024×768+)
- **Functional on mobile:** Phones work but not optimized (scrolling required)—acceptable for emergency/on-the-go reviews

**Browser support:** Modern evergreen browsers only (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)—no IE11, no legacy support.

---

## Technical Assumptions

### Repository Structure

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

### Service Architecture

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

### Testing Requirements

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

### Additional Technical Assumptions and Requests

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

## Epic List

### Epic 1: Foundation & Authentication Infrastructure
*Establish project foundation with Docker Compose setup, PostgreSQL database, basic authentication system, and initial health check endpoint to validate deployment.*

### Epic 2: File Monitoring & Queue System
*Implement polling-based file watcher service that detects new documents in scan folder and queues them for processing with lightweight queue infrastructure.*

### Epic 3: AI Analysis Engine
*Build Gemini Vision integration with document analysis worker that classifies documents, extracts key information, consults external data sources, and generates routing recommendations with confidence scores.*

### Epic 4: Email Notification System
*Create batch email service with 15-second idle trigger that sends HTML summary emails with document thumbnails, AI recommendations, and review links.*

### Epic 5: Web Review Interface & Approval Workflow
*Develop web-based document review page with authentication, document preview, editable routing fields, and approval/rejection workflow that executes file operations.*

### Epic 6: Deployment & Documentation
*Finalize Docker deployment configuration, create comprehensive setup documentation, provide example data sources, and validate end-to-end workflows across platforms.*

---

## Epic 1: Foundation & Authentication Infrastructure

**Epic Goal:** Establish the foundational project infrastructure including Node.js monorepo setup, Docker Compose orchestration, PostgreSQL database with schema, basic Express.js API with health check endpoint, and JWT-based authentication system. This epic delivers a fully deployable skeleton that validates the infrastructure works before adding business logic.

### Story 1.1: Project Initialization and Monorepo Setup

**As a** developer,
**I want** a properly initialized Node.js monorepo with shared workspace configuration,
**so that** all services can share common utilities and dependencies efficiently.

#### Acceptance Criteria

1. Git repository initialized with .gitignore excluding node_modules, .env, and common Node.js artifacts
2. Root package.json configured with workspaces for services/ subdirectories (watcher, worker, api, mailer)
3. Node.js v24.5.0 specified in package.json engines field and .nvmrc file
4. Shared workspace created at shared/ directory with common utilities (logger config, constants, types)
5. ESLint and Prettier configured for consistent code formatting across all services
6. README.md includes project overview and links to setup documentation
7. LICENSE file added (MIT or Apache 2.0 for open source)
8. .env.example file created with placeholder values for all required environment variables

### Story 1.2: Docker Compose Infrastructure Setup

**As a** system administrator,
**I want** Docker Compose configuration that orchestrates all services with single command,
**so that** I can deploy the entire system without manual service management.

#### Acceptance Criteria

1. docker-compose.yml defines services: postgres, redis, api, watcher, worker, mailer
2. PostgreSQL service configured with persistent volume for data storage and health check
3. Redis service configured with persistent volume and health check
4. All application services configured with restart policies (unless-stopped)
5. Environment variables loaded from .env file into service containers
6. Network configuration allows inter-service communication (shared bridge network)
7. Volume mounts configured for scan folder and output folder access from host
8. Health check endpoints configured for all application services
9. docker-compose up command successfully starts all services with proper dependency ordering
10. docker-compose down cleanly stops all services without orphaned containers

### Story 1.3: PostgreSQL Database Schema and Migrations

**As a** developer,
**I want** PostgreSQL database with initial schema for users, documents, and queue,
**so that** services have persistent storage for application state.

#### Acceptance Criteria

1. Database migration tool (node-pg-migrate) configured in api service
2. Initial migration creates users table with fields: id, username, password_hash, created_at, updated_at
3. Initial migration creates documents table with fields: id, filename, scan_path, scan_timestamp, status, analysis_result (JSONB), destination_path, user_action, user_id, created_at, updated_at
4. Initial migration creates processing_queue table with fields: id, document_id, status, retry_count, error_message, created_at, updated_at
5. Indexes created on documents.status, documents.user_id, processing_queue.status
6. Database connection pooling configured with max 20 connections
7. Migration runs automatically on api service startup if not already applied
8. Connection string read from DATABASE_URL environment variable
9. Database connection failure results in service failing to start with clear error message

### Story 1.4: Express.js API Service with Health Check

**As a** system operator,
**I want** basic Express.js API with health check endpoint,
**so that** I can verify the service is running and connected to dependencies.

#### Acceptance Criteria

1. Express.js server configured listening on port from environment variable (default 3000)
2. Pino logger configured with structured JSON output to stdout
3. GET /health endpoint returns 200 OK with JSON: {status: "healthy", timestamp, version}
4. GET /health/db endpoint tests database connection and returns 200 if successful, 503 if failed
5. GET /health/redis endpoint tests Redis connection and returns 200 if successful, 503 if failed
6. CORS middleware configured allowing requests from frontend origin
7. Error handling middleware catches unhandled errors and returns 500 with logged stack trace
8. Request logging middleware logs all requests with method, path, status code, response time
9. Graceful shutdown handler closes database connections and HTTP server on SIGTERM/SIGINT
10. Service starts successfully within 5 seconds and responds to health check requests

### Story 1.5: JWT Authentication System

**As a** user,
**I want** secure login with username and password,
**so that** only I can access document review interface and approve file operations.

#### Acceptance Criteria

1. POST /auth/register endpoint accepts username and password, hashes password with bcrypt (10 rounds), creates user in database, returns JWT token
2. POST /auth/login endpoint validates username/password against database, returns JWT token with 24-hour expiration on success
3. JWT tokens signed with RS256 algorithm using private key from environment variable (PEM format)
4. JWT payload includes: user_id, username, issued_at (iat), expires_at (exp)
5. Authentication middleware validates JWT from Authorization: Bearer header
6. Authentication middleware returns 401 Unauthorized if token missing, expired, or invalid
7. Authentication middleware attaches user object to request for downstream handlers
8. Password validation requires minimum 8 characters (configurable via env)
9. Duplicate username registration returns 409 Conflict error
10. Invalid login credentials return 401 Unauthorized (generic message to avoid username enumeration)
11. Token refresh not implemented in MVP (user re-authenticates after 24h expiration)

---

## Epic 2: File Monitoring & Queue System

**Epic Goal:** Implement polling-based file system monitoring service that continuously watches the configured scan folder for new PDF and image files, detects file creation with stability checks to avoid processing incomplete files, and queues discovered documents into a lightweight processing queue backed by Redis or PostgreSQL. This epic delivers the system's "input pipeline" that feeds all downstream processing.

### Story 2.1: Polling-Based File Watcher Service

**As a** system,
**I want** continuous monitoring of scan folder using polling to detect new documents,
**so that** I can trigger processing pipeline when users scan documents.

#### Acceptance Criteria

1. Watcher service runs as standalone Node.js process in Docker container
2. Scan folder path read from SCAN_FOLDER_PATH environment variable
3. Polling interval configurable via POLL_INTERVAL_MS environment variable (default 3000ms / 3 seconds)
4. Service maintains in-memory snapshot of folder contents (filenames and sizes) between polls
5. Each poll cycle compares current folder state to previous snapshot to detect new files
6. Only files with extensions .pdf, .png, .jpg, .jpeg, .tiff processed (case-insensitive)
7. Service starts successfully and logs "File watcher started, monitoring: {path}" on startup
8. Graceful shutdown stops polling loop on SIGTERM/SIGINT
9. Folder access errors (permissions, path not found) logged with ERROR level and service retries after 30 seconds
10. Service exposes GET /health endpoint returning 200 OK with last poll timestamp

### Story 2.2: File Stability Detection

**As a** system,
**I want** to detect when scanner has finished writing a file,
**so that** I don't process incomplete or locked documents.

#### Acceptance Criteria

1. When new file detected, service records filename and file size in pending files map
2. On next poll cycle, service checks if file size has changed since last observation
3. File considered "stable" only after file size unchanged for 2 consecutive poll cycles (6 seconds with default 3s polling)
4. Stable files moved from pending map to "ready for processing" list
5. Files still being written remain in pending map for up to 10 poll cycles (30 seconds)
6. If file size still changing after 10 cycles, log WARNING and process anyway (assume slow scanner)
7. If file disappears from folder while pending, remove from pending map and log INFO message
8. File lock detection attempted by trying to open file in read mode before marking stable
9. If file locked, retry on next poll cycle without counting as stable observation
10. Stability check timeout configurable via FILE_STABILITY_TIMEOUT_MS environment variable

### Story 2.3: Lightweight Queue Implementation

**As a** worker service,
**I want** reliable queue for document processing jobs,
**so that** I can process documents asynchronously without losing jobs if service restarts.

#### Acceptance Criteria

1. Queue implementation uses Redis Lists (LPUSH/RPOP) for job storage
2. Queue module exports addJob(documentData) and getNextJob() async functions
3. addJob() pushes JSON-serialized job to Redis list "ai-scanner:queue:pending"
4. Job payload includes: documentId (UUID), filename, scanPath, detectedAt (ISO timestamp)
5. getNextJob() pops job from Redis list atomically and returns deserialized object
6. If Redis unavailable, addJob() retries 3 times with exponential backoff (1s, 2s, 4s) then throws error
7. Queue length exposed via getQueueLength() function querying Redis LLEN
8. Failed jobs moved to "ai-scanner:queue:failed" list with error details for manual inspection
9. Queue module includes clearQueue() function for testing (removes all pending jobs)
10. Redis connection pooling configured with auto-reconnect on connection loss

### Story 2.4: Document Queue Integration

**As a** file watcher service,
**I want** to create queue jobs for stable files and track them in database,
**so that** worker service can process documents reliably.

#### Acceptance Criteria

1. When file marked stable, watcher service generates UUID for document
2. Watcher inserts document record into PostgreSQL documents table with status "queued"
3. Document record includes: id (UUID), filename, scan_path (absolute path), scan_timestamp, status
4. After database insert, watcher calls queue.addJob() with document metadata
5. If database insert fails, log ERROR and skip queue insertion (don't queue without DB record)
6. If queue insertion fails after successful DB insert, update document status to "queue_failed" in database
7. Watcher logs INFO message: "Document queued: {filename} (id: {uuid})"
8. Duplicate file detection: if file with same filename already exists in DB with status "queued" or "processing", skip and log WARNING
9. Service tracks metrics: total files detected, files queued, files skipped (duplicates), queue errors
10. Metrics exposed via GET /metrics endpoint returning JSON with counter values

### Story 2.5: Worker Service Skeleton and Job Polling

**As a** worker service,
**I want** to continuously poll queue for new jobs,
**so that** I can process documents as they arrive.

#### Acceptance Criteria

1. Worker service runs as standalone Node.js process in Docker container
2. Worker polls queue every 1 second using queue.getNextJob() (blocking with timeout preferred if Redis supports BRPOP)
3. When job received, worker updates document status to "processing" in database
4. Worker logs INFO message: "Processing document: {filename} (id: {uuid})"
5. Worker service supports graceful shutdown: stops polling and waits for current job to complete before exiting
6. If no jobs available, worker logs DEBUG message and continues polling (not spamming logs)
7. Worker handles queue connection errors by logging ERROR and retrying after 5 seconds
8. Worker exposes GET /health endpoint returning 200 OK with last job processed timestamp
9. Worker can be scaled to multiple instances (each polls independently, Redis RPOP is atomic)
10. For MVP, worker includes placeholder processDocument() async function that logs "TODO: analyze document" and marks status "pending_analysis"

---

## Epic 3: AI Analysis Engine

**Epic Goal:** Build the AI-powered document analysis system that processes queued documents using Google Gemini Vision API. This includes loading and parsing external data sources (PO logs, vendor lists, folder structures), sending documents with multimodal prompts to Gemini for classification and reasoning, extracting structured recommendations with confidence scores, and handling large documents by processing only the first 5 pages. This epic delivers the core intelligence that transforms scanned documents into actionable routing recommendations.

### Story 3.1: External Data Source Loading

**As a** worker service,
**I want** to load external data sources (PO logs, vendor lists, folder structures) from CSV and JSON files,
**so that** AI can use contextual information for intelligent routing recommendations.

#### Acceptance Criteria

1. Worker service loads data sources on startup from paths specified in environment variables: PO_LOGS_PATH, VENDOR_LIST_PATH, FOLDER_STRUCTURE_PATH
2. PO logs CSV parser reads file with columns: po_number, vendor_name, date, amount, status (using csv-parser library)
3. Vendor list CSV parser reads file with columns: vendor_id, vendor_name, aliases (comma-separated alternate names)
4. Folder structure JSON parser reads file with array of objects: {path, description, document_types[]}
5. Parsed data stored in memory as JavaScript objects/arrays for fast lookup during analysis
6. If data source file missing or malformed, log WARNING and continue with empty dataset (don't crash service)
7. Data sources refreshed via POST /admin/reload-data endpoint (authenticated, returns count of loaded records)
8. Service logs INFO with record counts: "Loaded {n} PO logs, {m} vendors, {k} folder paths"
9. Data sources reloaded on SIGHUP signal for runtime updates without restart
10. Data structures exposed via GET /admin/data-status endpoint showing last loaded timestamp and record counts

### Story 3.2: PDF and Image Processing

**As a** worker service,
**I want** to extract text from PDFs via OCR and convert pages to images,
**so that** I can send both visual and textual content to Gemini API.

#### Acceptance Criteria

1. Worker detects file type by extension: .pdf uses PDF processing, .png/.jpg/.jpeg/.tiff uses image processing
2. PDF processing uses pdf-parse library to extract text content and page count
3. PDF with 50+ pages processes only first 5 pages, logs INFO: "Large document detected ({n} pages), processing first 5"
4. PDF pages converted to images using pdf-to-img or similar library (PNG format, 150 DPI)
5. For multi-page PDFs, first page image used for Gemini Vision, remaining pages' text concatenated
6. Image files read directly from disk as buffers for Gemini API
7. OCR performed by Gemini Vision (no separate OCR library needed for MVP)
8. Extracted text and page count included in document metadata stored in database
9. Processing handles corrupted files gracefully: log ERROR, update document status to "processing_failed", add to failed queue
10. Temporary image files cleaned up after analysis complete (use temp directory with auto-cleanup)

### Story 3.3: Gemini Vision API Integration

**As a** worker service,
**I want** to send document images and text to Gemini API with structured prompt,
**so that** I receive AI-powered classification and routing recommendations.

#### Acceptance Criteria

1. Gemini client initialized using @google/generative-ai library with API key from GEMINI_API_KEY environment variable
2. Default model set to "gemini-1.5-flash" (configurable via GEMINI_MODEL environment variable)
3. Multimodal prompt includes: document image (first page), extracted OCR text, external data context (PO logs snippet, vendor list, folder structure)
4. Prompt template loaded from external file (prompts/analysis-prompt.txt) for easy customization
5. Prompt requests structured JSON output with fields: document_type, confidence_score (0-100), extracted_fields {vendor, po_number, date, etc.}, recommended_folder_path, recommended_filename, reasoning (1-2 sentences)
6. API request includes generation config: response_mime_type="application/json", temperature=0.2 (deterministic), max_output_tokens=2048
7. Rate limiting implemented: max 15 requests per minute using token bucket algorithm in Redis
8. If rate limit exceeded, worker queues job back with retry delay (60 seconds) and increments retry_count
9. API timeout set to 30 seconds, on timeout mark job for retry (max 3 retries)
10. API errors logged with ERROR level including error code, message, and document ID

### Story 3.4: Structured Response Parsing and Validation

**As a** worker service,
**I want** to parse and validate Gemini's JSON response,
**so that** I have reliable, well-formed recommendations for user review.

#### Acceptance Criteria

1. Worker parses Gemini response as JSON, handles malformed JSON gracefully with try-catch
2. Response validator checks required fields present: document_type, confidence_score, recommended_folder_path, recommended_filename
3. Confidence score validated as number between 0-100, defaults to 50 if invalid
4. Recommended folder path validated against loaded folder structure, fallback to "/uncategorized" if invalid
5. Recommended filename sanitized: remove invalid characters (/, \, :, *, ?, ", <, >, |), replace spaces with underscores, ensure extension preserved
6. Extracted fields stored as JSONB in documents.analysis_result column
7. If validation fails, log WARNING with validation errors and use fallback values (don't fail entire job)
8. Reasoning text truncated to 500 characters if exceeds limit
9. Worker logs INFO: "Analysis complete: {document_type} (confidence: {score}%) -> {folder_path}/{filename}"
10. Parsed result structure matches schema expected by email and web UI services

### Story 3.5: Large Document Handling and Page Count Context

**As a** worker service,
**I want** to inform Gemini when processing large multi-page documents,
**so that** AI provides context-aware recommendations accounting for partial processing.

#### Acceptance Criteria

1. When document has 50+ pages, prompt includes explicit context: "This is a {n}-page document. Only the first 5 pages are being analyzed."
2. Prompt requests AI to note if document appears incomplete or would benefit from full analysis
3. Database stores is_partial_analysis boolean flag for documents processed with page limit
4. Document metadata includes total_pages and analyzed_pages counts
5. Large document prompt template variant loaded from prompts/analysis-prompt-large.txt
6. Worker logs WARNING for documents exceeding 100 pages: "Very large document ({n} pages), analysis may be limited"
7. If first 5 pages are blank or unreadable, worker extends analysis to next 5 pages (up to 10 pages max)
8. Page count context included in reasoning explanation returned by AI
9. Web UI and email display page count info: "Analyzed 5 of 127 pages" for user awareness
10. Post-MVP: Consider adding "request full analysis" feature for large documents

### Story 3.6: Analysis Result Storage and Queue Completion

**As a** worker service,
**I want** to save analysis results to database and mark job complete,
**so that** downstream services can access recommendations and trigger notifications.

#### Acceptance Criteria

1. After successful analysis, worker updates documents table: status="analyzed", analysis_result (JSONB with full response), updated_at (timestamp)
2. Analysis result includes: document_type, confidence_score, extracted_fields, recommended_folder_path, recommended_filename, reasoning, analyzed_at (ISO timestamp)
3. Worker removes job from processing queue (job considered complete)
4. If database update fails, retry 3 times with 1-second delay, then move job to failed queue
5. Worker updates processing_queue table: status="completed", completed_at (timestamp)
6. Worker emits event or updates flag triggering email service batch check (simple Redis pub/sub or database flag)
7. Worker logs INFO: "Document {id} analyzed successfully, triggering notification check"
8. Failed analysis updates document status to "analysis_failed", stores error message in analysis_result.error field
9. Worker tracks metrics: documents analyzed, average confidence score, analysis duration, failures
10. Metrics exposed via GET /metrics endpoint with rolling 24-hour statistics

---

## Epic 4: Email Notification System

**Epic Goal:** Create the batch email notification service that monitors for analyzed documents, implements a 15-second idle trigger to batch multiple scans into single email, generates HTML email summaries with document thumbnails and AI recommendations, and sends emails with unique review links for each document. This epic delivers the critical user notification layer that bridges AI analysis to human review.

### Story 4.1: Batch Trigger and Idle Detection

**As a** mailer service,
**I want** to detect when documents are analyzed and batch them with 15-second idle trigger,
**so that** users receive single summary email instead of inbox-spamming individual notifications.

#### Acceptance Criteria

1. Mailer service runs as standalone Node.js process in Docker container
2. Service polls database every 2 seconds for documents with status="analyzed" and notified=false
3. When analyzed documents found, service starts 15-second idle timer
4. If new documents analyzed during 15-second window, timer resets (extends batch window)
5. When 15 seconds pass with no new analyzed documents, trigger batch email generation
6. Service updates documents.notified=true for all documents included in batch
7. Batch metadata stored in new batches table: id, document_ids (array), created_at, email_sent_at, status
8. Service logs INFO: "Batch triggered: {n} documents ready for notification"
9. Idle timeout configurable via BATCH_IDLE_TIMEOUT_MS environment variable (default 15000)
10. Service exposes GET /health endpoint returning 200 OK with last batch sent timestamp

### Story 4.2: Document Thumbnail Generation

**As a** mailer service,
**I want** to generate small thumbnail images of document first pages,
**so that** email includes visual preview helping users identify documents.

#### Acceptance Criteria

1. For each document in batch, service generates thumbnail image from first page (200px width, maintain aspect ratio)
2. PDF documents: convert first page to image using pdf-to-img or similar, resize to thumbnail
3. Image documents: load original image, resize to thumbnail using sharp library
4. Thumbnails saved to temporary directory with filename: {document_id}_thumb.png
5. Thumbnail generation timeout: 5 seconds per document, on failure use placeholder image (generic document icon)
6. Service includes fallback for corrupted/unreadable files: log WARNING and use placeholder
7. Thumbnails embedded in email as base64 data URIs (avoid external image hosting for MVP)
8. Base64 encoding size limited to 50KB per thumbnail (aggressive compression if needed)
9. Thumbnails cleaned up after email sent successfully (delete temp files)
10. Service logs DEBUG: "Generated thumbnail for document {id} ({size} bytes)"

### Story 4.3: HTML Email Template Generation

**As a** mailer service,
**I want** to generate HTML email with document summaries and review links,
**so that** users can quickly review AI recommendations and access web interface.

#### Acceptance Criteria

1. Email template loaded from templates/batch-summary.html with mustache or handlebars templating
2. Template includes: batch summary header ("You have {n} documents ready for review"), document list, footer with settings link
3. Each document entry shows: thumbnail image, filename, detected document type, confidence score with color coding (green >80%, yellow 60-80%, red <60%), recommended folder path, recommended filename, "Review & Approve" button/link
4. Review link format: {WEB_UI_BASE_URL}/review/{document_id}?token={review_token}
5. Review token generated as short-lived JWT (4 hour expiration) signed with REVIEW_TOKEN_SECRET, payload includes: document_id, batch_id
6. Confidence score displayed prominently with visual indicator (colored badge or progress bar)
7. Email includes plain text fallback version with document list and review URLs (no HTML formatting)
8. Template supports dark mode with @media (prefers-color-scheme: dark) CSS rules
9. Email width constrained to 600px for compatibility across email clients
10. Template tested manually with Gmail, Outlook, Apple Mail preview during development

### Story 4.4: SMTP Email Delivery

**As a** mailer service,
**I want** to send batch summary emails via SMTP,
**so that** users receive notifications in their inbox.

#### Acceptance Criteria

1. Nodemailer configured with SMTP settings from environment variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
2. Email sent with subject: "ai.scanner: {n} documents ready for review"
3. Recipient email address from NOTIFICATION_EMAIL environment variable (single user for MVP)
4. Email includes proper headers: From, To, Subject, Date, Message-ID
5. Service supports both authenticated SMTP (Gmail, SendGrid) and unauthenticated relay (local mail server)
6. Send timeout set to 30 seconds, on timeout mark batch as "send_failed" and log ERROR
7. On successful send, update batch status to "sent" and update email_sent_at timestamp
8. Failed send retries 3 times with exponential backoff (10s, 20s, 40s)
9. After 3 failed retries, batch marked "send_failed" and alert logged for manual investigation
10. Service logs INFO: "Batch email sent successfully to {recipient} ({n} documents)"

### Story 4.5: Email Delivery Error Handling

**As a** user,
**I want** system to handle email failures gracefully,
**so that** I don't lose document notifications if email is temporarily unavailable.

#### Acceptance Criteria

1. SMTP connection errors caught and logged with ERROR level including specific error message
2. Transient errors (network timeout, temporary unavailable) trigger retry logic (Story 4.4 AC8)
3. Permanent errors (authentication failed, recipient invalid) logged as CRITICAL and batch marked "send_failed_permanent"
4. Service tracks failed batches in database for manual retry or alternative notification
5. GET /admin/failed-batches endpoint returns list of failed batches with error details (authenticated)
6. POST /admin/retry-batch/{id} endpoint allows manual retry of failed batch (authenticated)
7. If email fails after multiple retries, service logs actionable message: "Email delivery failed. Review documents at: {WEB_UI_URL}/pending"
8. Service continues processing new batches even if previous batch failed (don't block on failures)
9. Dashboard or health check endpoint shows email delivery success rate (successful sends / total attempts)
10. Alternative notification methods (webhook, Slack) noted as post-MVP enhancement

### Story 4.6: Batch Processing Metrics and Monitoring

**As a** system administrator,
**I want** visibility into batch processing performance and health,
**so that** I can troubleshoot issues and monitor system reliability.

#### Acceptance Criteria

1. Service tracks metrics: total batches sent, average batch size, average idle time before trigger, failed sends
2. Metrics exposed via GET /metrics endpoint returning JSON with counters and averages
3. Service logs INFO summary for each batch: "Batch {id}: {n} documents, idle time {ms}ms, email sent in {ms}ms"
4. Database batches table stores: document_ids, created_at, triggered_at, email_sent_at, status, error_message
5. Batch history retained for 30 days (configurable), then auto-purged by scheduled cleanup job
6. Service tracks email send duration (from Nodemailer call to SMTP response) for performance monitoring
7. Slow sends (>10 seconds) logged as WARNING: "Slow email delivery: {duration}ms"
8. Service health check includes last successful batch timestamp and last error timestamp
9. Metrics include 24-hour rolling statistics: batches sent today, documents notified today, failure rate
10. Service exposes GET /admin/batches endpoint returning recent batch history with status (authenticated, paginated)

---

## Epic 5: Web Review Interface & Approval Workflow

**Epic Goal:** Develop the web-based document review and approval interface that authenticates users, displays document previews with AI analysis results, allows editing of routing recommendations, executes file operations on user approval, and provides clear feedback on success or failure. This epic delivers the human-in-the-loop control layer that ensures users maintain full authority over document routing decisions.

### Story 5.1: Frontend Application Structure and Routing

**As a** developer,
**I want** organized frontend application with routing for login and review pages,
**so that** users can navigate between authentication and document review flows.

#### Acceptance Criteria

1. Frontend served as static files from frontend/ directory via Express static middleware
2. Single-page application structure with vanilla JavaScript (or minimal Alpine.js/htmx for reactivity)
3. Client-side routing handles two main views: /login and /review/:documentId
4. Index.html includes viewport meta tag for responsive design and links to styles.css and app.js
5. App.js implements simple router checking URL path and rendering appropriate view
6. Navigation between views updates browser history (pushState) without full page reload
7. 404 handler shows "Page not found" message for invalid routes
8. Frontend assets served with proper MIME types and cache headers (1 hour for CSS/JS)
9. Frontend build process not required for MVP (no webpack/vite—keep it simple)
10. Directory structure: frontend/index.html, frontend/css/styles.css, frontend/js/app.js, frontend/js/auth.js, frontend/js/review.js

### Story 5.2: Login Page and JWT Authentication Flow

**As a** user,
**I want** to log in with username and password,
**so that** I can securely access document review interface.

#### Acceptance Criteria

1. Login page displays centered form with fields: username (text input), password (password input), "Remember me" checkbox, "Login" button
2. Form submission sends POST to /auth/login with JSON body: {username, password}
3. On successful login (200 response with JWT token), store token in localStorage (or sessionStorage if "Remember me" unchecked)
4. After login, redirect user to originally requested URL or /pending dashboard (if implemented) or wait for email link
5. On login failure (401 response), display error message: "Invalid username or password" below form
6. Password field includes "show/hide password" toggle icon for usability
7. Form includes basic client-side validation: both fields required, minimum 3 characters for username
8. Login button shows loading spinner during API call to prevent double-submission
9. JWT token included in all subsequent API requests via Authorization: Bearer {token} header
10. If user already logged in (valid token in storage), redirect from login page to dashboard/home

### Story 5.3: Document Review Page Layout and Data Loading

**As a** user,
**I want** to see document preview alongside AI recommendations,
**so that** I can verify the routing suggestion before approving.

#### Acceptance Criteria

1. Review page URL format: /review/{documentId}?token={reviewToken}
2. Page loads document data via GET /api/documents/{documentId} with review token from URL query param
3. If review token invalid or expired, show error: "This review link has expired. Please check your email for a new link."
4. Page layout: left panel (60% width) shows document preview, right panel (40% width) shows AI analysis and approval form
5. Document preview displays PDF using PDF.js library (embedded viewer with zoom, page navigation) or image using <img> tag
6. PDF viewer includes controls: zoom in/out, previous/next page, page counter (Page X of Y)
7. Loading state shows spinner while document data and preview load
8. If document not found or already processed, show appropriate message: "Document not found" or "This document has already been processed"
9. Page is responsive: on tablet/mobile (<1024px), layout stacks vertically (preview on top, form below)
10. Document metadata displayed: filename, scan date/time, page count (if multi-page PDF)

### Story 5.4: AI Analysis Display and Confidence Visualization

**As a** user,
**I want** to see AI's classification, confidence score, and reasoning,
**so that** I understand why the system made its recommendation and can trust the suggestion.

#### Acceptance Criteria

1. Right panel displays card titled "AI Analysis" with sections: Document Type, Confidence, Extracted Information, Recommendation, Reasoning
2. Document Type shown as prominent label/badge (e.g., "Packing List", "Purchase Order", "Invoice")
3. Confidence score displayed as percentage with visual indicator: progress bar or circular gauge, color-coded (green >80%, yellow 60-80%, red <60%)
4. Extracted Information section shows key-value pairs from analysis_result.extracted_fields: Vendor, PO Number, Date, etc. (only non-empty fields)
5. Recommendation section shows: "File to: {recommended_folder_path}" and "Filename: {recommended_filename}"
6. Reasoning text displayed in readable paragraph format (AI's 1-2 sentence explanation)
7. If document is partial analysis (50+ pages, only first 5 analyzed), show warning icon with tooltip: "Analyzed 5 of {total} pages"
8. Low confidence (<60%) shows warning message: "Low confidence - please review carefully before approving"
9. All text content properly escaped to prevent XSS (use textContent or sanitize HTML if needed)
10. Visual design clean and readable: good spacing, clear hierarchy, professional appearance

### Story 5.5: Editable Routing Fields and Form Interaction

**As a** user,
**I want** to edit recommended folder path and filename before approving,
**so that** I can correct AI mistakes or adjust routing based on my judgment.

#### Acceptance Criteria

1. Approval form includes editable fields: Destination Folder (text input or dropdown with folder structure), Filename (text input with extension locked)
2. Destination Folder field pre-filled with AI recommendation, includes autocomplete/suggestions from loaded folder structure
3. Filename field pre-filled with AI recommendation, extension shown as read-only suffix or locked part of input
4. Filename validation: client-side check for invalid characters (/, \, :, *, ?, ", <, >, |), show error if present
5. Character counter shows filename length (warn if >255 characters—file system limit)
6. Form includes action buttons: "Approve & File" (primary, green), "Reject" (secondary, gray), "Cancel" (tertiary, text link)
7. Folder field includes "Browse" button opening folder tree picker modal (MVP: simple dropdown, post-MVP: tree view)
8. Changes to form fields highlighted visually (e.g., field border changes color when edited from AI recommendation)
9. "Approve & File" button disabled if filename invalid or destination folder empty
10. Form remembers edits if user navigates away and returns (store in sessionStorage keyed by document ID)

### Story 5.6: Approval Action and File Operation Execution

**As a** user,
**I want** to approve routing recommendation and have file moved to destination,
**so that** document is filed correctly without manual file operations.

#### Acceptance Criteria

1. Clicking "Approve & File" shows confirmation modal: "File {filename} to {folder_path}?" with "Confirm" and "Cancel" buttons
2. On confirm, send POST /api/documents/{documentId}/approve with JSON body: {destination_folder, filename}
3. Request includes JWT auth token from localStorage in Authorization header
4. Button shows loading spinner during API call, disabled to prevent double-clicks
5. Backend validates user is authenticated and document belongs to user (or any user for MVP single-user mode)
6. Backend executes file move operation: move file from scan_path to {destination_folder}/{filename}
7. If destination file already exists, backend returns 409 Conflict error: "File already exists at destination"
8. On conflict, frontend shows error with options: "Overwrite", "Rename (append timestamp)", "Cancel"
9. On successful move (200 response), update document status to "filed" in database
10. Backend logs INFO: "Document {id} filed: {destination_folder}/{filename} by user {user_id}"

### Story 5.7: Success Confirmation and Navigation

**As a** user,
**I want** clear feedback when document is filed successfully,
**so that** I know action completed and can proceed to next document.

#### Acceptance Criteria

1. On successful file operation, show success message overlay: "Document filed successfully!" with green checkmark icon
2. Success message displays for 2 seconds, then auto-redirects to next pending document (if exists) or confirmation page
3. If more documents in same batch, redirect to /review/{nextDocumentId}?token={token}
4. If no more documents, show completion page: "All documents processed! You can close this window." with link to email for new batches
5. Success message includes filed location: "Filed to: {folder_path}/{filename}" for user confirmation
6. Redirect countdown shown: "Redirecting to next document in 2 seconds..." with "Skip" link for immediate redirect
7. User can click "View filed document" link to open destination folder in file explorer (if browser supports file:// protocol, otherwise show path to copy)
8. Page updates document status to "filed" in UI (if implementing dashboard view)
9. Browser back button after success shows message: "This document has already been processed"
10. Success analytics event logged (post-MVP: track time to approve, edits made, confidence score of approved docs)

### Story 5.8: Rejection and Error Handling

**As a** user,
**I want** to reject documents that AI misclassified or that need manual handling,
**so that** I can flag problematic documents without filing them incorrectly.

#### Acceptance Criteria

1. Clicking "Reject" button shows modal: "Why are you rejecting this document?" with textarea (optional) and "Confirm Rejection" button
2. On confirm, send POST /api/documents/{documentId}/reject with JSON body: {reason (optional)}
3. Backend updates document status to "rejected", stores rejection reason in database
4. Rejected documents moved to "rejected" folder (configured via REJECTED_FOLDER_PATH environment variable) with original filename
5. Success message: "Document rejected and moved to manual review folder" with path shown
6. Rejection creates audit log entry for troubleshooting: document_id, user_id, rejection_reason, timestamp
7. Rejected document marked for prompt improvement analysis (post-MVP: learn from rejections)
8. After rejection, redirect to next document or completion page (same flow as approval)
9. If file move to rejected folder fails, show error and leave document in scan folder with status "rejection_failed"
10. GET /admin/rejected-documents endpoint lists all rejected documents with reasons (for prompt tuning)

### Story 5.9: Error Handling and User Feedback

**As a** user,
**I want** clear error messages when something goes wrong,
**so that** I understand the issue and know what action to take.

#### Acceptance Criteria

1. Network errors (API unreachable) show message: "Unable to connect. Please check your internet connection and try again."
2. Authentication errors (401) redirect to login page with message: "Session expired. Please log in again."
3. Permission errors (403) show message: "You don't have permission to access this document."
4. File operation errors (500 from backend) show message: "Unable to file document. Error: {error message from API}"
5. All error messages include "Retry" button that repeats the failed action
6. File system errors (permission denied, disk full) show specific message from backend with troubleshooting guidance
7. Validation errors (invalid filename, missing folder) show inline below form field with red border
8. Timeout errors (API call >30s) show message: "Request timed out. The file operation may still be processing. Please check the destination folder."
9. Error state includes "Contact Support" link or instructions for manual filing
10. JavaScript errors caught globally and displayed as user-friendly message (not raw error stack), logged to console for debugging

---

## Epic 6: Deployment & Documentation

**Epic Goal:** Finalize the complete Docker Compose deployment configuration with all services integrated, create comprehensive setup documentation including platform-specific instructions (Linux/Windows/macOS), provide example configuration files and sample external data sources, write troubleshooting guides, and validate end-to-end workflows across different platforms to ensure the system is production-ready for open-source release.

### Story 6.1: Complete Docker Compose Integration

**As a** system administrator,
**I want** fully integrated Docker Compose configuration with all services working together,
**so that** I can deploy entire system with single command.

#### Acceptance Criteria

1. docker-compose.yml includes all services: postgres, redis, api, watcher, worker, mailer with correct dependency ordering (depends_on with health checks)
2. All services connected to shared Docker network "ai-scanner-network" for inter-service communication
3. Environment variables consolidated in .env file and properly injected into all service containers
4. Volume mounts configured: scan folder (host to watcher/worker), output folders (host to worker), database data (persistent), redis data (persistent)
5. All services start successfully with single `docker-compose up -d` command
6. Health checks configured for all services with appropriate intervals (30s) and retries (3)
7. Services restart automatically on failure (restart: unless-stopped)
8. Log aggregation: all service logs visible via `docker-compose logs -f`
9. Port mappings configured: API on host port 3000 (configurable via .env), PostgreSQL 5432 (localhost only), Redis 6379 (localhost only)
10. Complete startup test: fresh deployment processes test document end-to-end within 60 seconds

### Story 6.2: Environment Configuration and Secrets Management

**As a** system administrator,
**I want** clear configuration template with all required settings,
**so that** I can customize deployment for my environment.

#### Acceptance Criteria

1. .env.example file includes all required variables with descriptive comments and example values
2. Configuration sections organized: Database, Redis, API, Services, SMTP, Gemini API, Paths, Security
3. Each variable includes: name, example value, description, whether required or optional, default value if applicable
4. Security-sensitive variables clearly marked: GEMINI_API_KEY, SMTP_PASS, JWT_SECRET, REVIEW_TOKEN_SECRET
5. Path variables include example formats for Linux (/mnt/scans) and Windows (C:\scans) with instructions
6. README includes section "Generating Secrets" with commands: openssl rand -base64 32 for JWT secrets, ssh-keygen for RSA keys
7. Validation script (scripts/validate-env.js) checks .env file for missing required variables and shows helpful errors
8. .env file explicitly added to .gitignore with warning comment about not committing secrets
9. Docker Compose validates required environment variables and fails fast with clear error if missing
10. Example .env.example includes realistic test values that work out-of-the-box for quick start (except API keys which must be user-provided)

### Story 6.3: Sample Data Sources and Test Documents

**As a** new user,
**I want** example data sources and test documents,
**so that** I can quickly test system with realistic data.

#### Acceptance Criteria

1. examples/ directory includes: sample-po-logs.csv, sample-vendor-list.csv, sample-folder-structure.json
2. Sample PO logs include 20 realistic entries with various vendors, dates, amounts
3. Sample vendor list includes 10 vendors with common aliases (e.g., "Acme Corp", "ACME", "Acme Corporation")
4. Sample folder structure includes realistic QMS folder hierarchy: /Quality/Suppliers/{Vendor}/POs, /Quality/Suppliers/{Vendor}/PackingLists, /Finance/Invoices, etc.
5. examples/test-documents/ includes 5 sample documents: 2 packing lists, 1 invoice, 1 purchase order, 1 inspection report (PDFs and images)
6. README section "Testing Your Setup" provides step-by-step instructions for processing test documents
7. Test documents designed to match sample data (vendor names, PO numbers) for realistic AI analysis results
8. examples/prompts/ includes default prompt templates: analysis-prompt.txt, analysis-prompt-large.txt with inline comments explaining placeholders
9. Sample documents are royalty-free or created specifically for project (no copyright issues for open source)
10. Quick start script (scripts/load-examples.sh) copies sample data to configured paths for immediate testing

### Story 6.4: Setup Documentation and Installation Guide

**As a** new user,
**I want** clear step-by-step setup instructions,
**so that** I can install and configure system in under 15 minutes.

#### Acceptance Criteria

1. README.md includes sections: Overview, Features, Prerequisites, Quick Start, Configuration, Usage, Troubleshooting, Contributing
2. Prerequisites clearly listed: Docker 20+, Docker Compose 2.0+, Node.js v24.5.0 (for local development), network folder access, Gemini API key
3. Quick Start section: numbered steps from "git clone" to "first document processed" in <15 steps
4. Platform-specific setup instructions in docs/setup-{linux|windows|macos}.md covering: Docker installation, folder mounting, network share access
5. Windows-specific instructions cover: WSL2 vs Docker Desktop, mounting SMB shares, handling Windows paths in .env
6. macOS-specific instructions cover: Docker Desktop setup, mounting network shares, file permissions
7. Configuration section explains each .env variable with examples and common values
8. Gemini API key acquisition documented: link to Google AI Studio, free tier explanation, API key generation steps
9. SMTP configuration examples for common providers: Gmail (app password), SendGrid (API key as password), local relay
10. Setup validation checklist: health check endpoints, test document processing, email delivery test

### Story 6.5: Troubleshooting Guide and Common Issues

**As a** user encountering issues,
**I want** troubleshooting guide for common problems,
**so that** I can resolve issues without external support.

#### Acceptance Criteria

1. docs/troubleshooting.md includes sections organized by symptom: Services Won't Start, Files Not Detected, Analysis Failing, Email Not Sending, File Operations Failing
2. Each issue includes: Symptom, Possible Causes, Diagnostic Steps, Solutions
3. Common issues documented: Docker permission errors, network folder not accessible, Gemini API quota exceeded, SMTP authentication failed, file lock errors
4. Diagnostic commands provided for each issue: docker-compose logs {service}, health check URLs, manual API tests with curl
5. Log interpretation guide: common error messages explained with solutions
6. Performance troubleshooting: slow analysis, email delays, high memory usage
7. Security issues covered: JWT token expired, review link not working, unauthorized access attempts
8. Network troubleshooting: Docker networking issues, host-container communication, external API connectivity
9. Each solution includes verification step: "You'll know it's fixed when..."
10. FAQ section covers: "Can I use different AI model?", "How to add more folders?", "How to backup database?", "How to upgrade version?"

### Story 6.6: Development Setup and Contributing Guide

**As a** developer wanting to contribute,
**I want** local development setup instructions,
**so that** I can run services locally and make code changes.

#### Acceptance Criteria

1. docs/development.md includes: Local Development Setup, Project Structure, Running Tests, Code Style, Submitting PRs
2. Local development without Docker documented: running each service locally with `npm run dev`, database setup with local PostgreSQL
3. Project structure documented: directory layout, service responsibilities, shared code location
4. Development scripts in package.json: dev (run all services), test (run test suite), lint (ESLint), format (Prettier)
5. Testing instructions: unit tests with Jest, integration tests, manual testing checklist
6. Code style guide references: ESLint config, Prettier config, naming conventions, commit message format
7. CONTRIBUTING.md includes: Code of Conduct, how to report bugs, how to suggest features, PR process, coding standards
8. Development environment variables documented (separate from production .env)
9. Debugging instructions: VS Code launch configurations, attaching debugger to Docker containers, log levels
10. Architecture overview: service interaction diagram, data flow, external dependencies

### Story 6.7: End-to-End Testing and Platform Validation

**As a** project maintainer,
**I want** validated deployment on Linux, Windows, and macOS,
**so that** I can confidently release to users on all platforms.

#### Acceptance Criteria

1. Complete E2E test executed on Linux (Ubuntu 22.04): deployment, document processing, email delivery, file operations verified
2. Complete E2E test executed on Windows 11 with Docker Desktop: same workflow validated including SMB share mounting
3. Complete E2E test executed on macOS (latest) with Docker Desktop: same workflow validated
4. Test checklist includes: service startup, health checks, file detection, analysis with Gemini API, email delivery, web UI login, document approval, file moved to destination
5. Platform-specific issues documented in troubleshooting guide with solutions
6. Performance benchmarks captured: startup time, time to process single document, time to process 10 documents, memory usage per service
7. Security validation: HTTPS works with self-signed cert, JWT authentication blocks unauthorized access, file operations respect permissions
8. Network folder access validated: Linux NFS mount, Windows SMB share, macOS AFP/SMB share all work correctly
9. Email client testing: batch summary renders correctly in Gmail, Outlook, Apple Mail (screenshots captured)
10. Test results documented in docs/test-results.md with platform matrix, pass/fail status, performance metrics

### Story 6.8: Release Preparation and Documentation Polish

**As a** project maintainer,
**I want** polished documentation and release assets,
**so that** open-source release makes strong first impression.

#### Acceptance Criteria

1. README.md includes badges: license, version, build status (if CI configured), Docker pulls
2. Screenshots added to README: architecture diagram, email screenshot, web UI screenshot (login and review pages)
3. LICENSE file confirmed (MIT or Apache 2.0) with copyright year and author
4. CHANGELOG.md created with v1.0.0 entry listing all features and known limitations
5. GitHub repository description, topics/tags configured: document-management, ai, gemini, docker, nodejs, ocr, automation
6. .github/ templates added: ISSUE_TEMPLATE (bug report, feature request), PULL_REQUEST_TEMPLATE
7. Security policy created (SECURITY.md): how to report vulnerabilities, supported versions
8. All documentation reviewed for: spelling/grammar, broken links, outdated information, clarity
9. Docker Hub repository created with automated builds, README synced, version tags configured
10. Release checklist completed: all tests pass, documentation complete, examples work, security review done

---

## Checklist Results Report

### Executive Summary

- **Overall PRD Completeness:** 95%
- **MVP Scope Appropriateness:** Just Right
- **Readiness for Architecture Phase:** Ready
- **Most Critical Gaps:** Minor - needs output to file before proceeding to architecture phase

**Assessment:** This PRD is exceptionally well-structured and comprehensive. All 6 epics are fully detailed with 39 user stories and complete acceptance criteria. The MVP scope is realistic for a 1-week timeline with proper prioritization. Requirements are clear, testable, and properly sequenced. The PRD is ready for architect handoff.

### Category Analysis Table

| Category                         | Status  | Critical Issues                          |
| -------------------------------- | ------- | ---------------------------------------- |
| 1. Problem Definition & Context  | PASS    | None                                     |
| 2. MVP Scope Definition          | PASS    | None                                     |
| 3. User Experience Requirements  | PASS    | None                                     |
| 4. Functional Requirements       | PASS    | None                                     |
| 5. Non-Functional Requirements   | PASS    | None                                     |
| 6. Epic & Story Structure        | PASS    | None                                     |
| 7. Technical Guidance            | PASS    | None                                     |
| 8. Cross-Functional Requirements | PASS    | None                                     |
| 9. Clarity & Communication       | PASS    | Document now written to file             |

### Top Issues by Priority

**BLOCKERS:** None

**HIGH:** None (document has been written to file)

**MEDIUM:**
- Consider adding architectural diagrams (can be added during architecture phase)

**LOW:**
- Could add more specific examples in some acceptance criteria
- Could add estimated story points (not critical for AI agent execution)

### Detailed Category Validation

#### 1. Problem Definition & Context - PASS (100%)

✅ Clear problem statement from Brief: manual document routing is time-consuming, error-prone, costly
✅ Target users well-defined: QMS managers, medical office staff, SMB organizations
✅ Success metrics quantified: 90% time reduction, 85% accuracy, <15s processing
✅ Business goals specific: 10+ adoptions in 3 months, 100+ GitHub stars
✅ Competitive analysis included in Brief (enterprise DMS vs OCR tools vs scanner software)

**Strengths:** Problem statement ties directly to real user pain (from stakeholder's own experience). Quantified impact (30 min/day productivity loss) makes business case compelling.

#### 2. MVP Scope Definition - PASS (100%)

✅ Core features clearly separated from post-MVP (Brief section "Out of Scope for MVP")
✅ Each epic delivers incremental value (foundation → file monitoring → AI → email → UI → deployment)
✅ Scope minimizes complexity while remaining viable (no desktop apps, no advanced features)
✅ Rationale for inclusion/exclusion documented throughout
✅ MVP success criteria defined: 70% accuracy, <15s processing, 7-day uptime

**Strengths:** Ruthless prioritization evident (no PDF editing, no multi-user RBAC, no mobile app). 1-week timeline forces focus. Post-MVP vision provides growth path without bloating MVP.

#### 3. User Experience Requirements - PASS (95%)

✅ Primary user flow documented: email → review link → approve → filed
✅ UI Design Goals section covers: UX vision, interaction paradigms, core screens, accessibility, branding, platforms
✅ Accessibility specified: WCAG AA compliance
✅ Platform compatibility: desktop-first, tablet-optimized, mobile-functional
✅ Error states covered in Epic 5 Story 5.9
✅ Performance expectations: responsive UI, <5s page loads

**Strengths:** "Invisible and trustworthy" UX vision is clear product philosophy. Confidence score color-coding helps users make quick decisions. Email-centric design eliminates dashboard complexity.

#### 4. Functional Requirements - PASS (100%)

✅ 20 functional requirements (FR1-FR20) covering all MVP features
✅ Requirements focus on WHAT not HOW (implementation left to architect)
✅ Requirements are testable and verifiable
✅ Consistent terminology used throughout
✅ Dependencies identified
✅ All 39 user stories have complete acceptance criteria

**Strengths:** Requirements written from system/user perspective. Acceptance criteria are specific and measurable. Story sequencing ensures dependencies met before dependent features built.

#### 5. Non-Functional Requirements - PASS (100%)

✅ Performance: <5s single-page, <15s 50-page, 100+ docs/day throughput
✅ Security: JWT auth, HTTPS, no secrets in code, session timeout, file permissions validation
✅ Reliability: 7-day uptime, zero data loss, retry logic, graceful degradation
✅ Technical constraints: Node.js v24.5.0, Docker Compose, PostgreSQL, Redis, SMTP
✅ Scalability: worker can scale horizontally, queue handles concurrency

**Strengths:** NFRs are specific and measurable. Security requirements appropriate for compliance use cases. Zero data loss as hard constraint shows understanding of critical nature.

#### 6. Epic & Story Structure - PASS (100%)

✅ 6 epics representing cohesive functionality blocks
✅ Epic sequencing follows dependencies
✅ Epic 1 includes foundation and first deliverable
✅ Stories sized for AI agent execution
✅ 39 total stories averaging 6.5 stories per epic
✅ All stories follow user story format
✅ Acceptance criteria are testable, specific, and complete

**Strengths:** First epic delivers deployable infrastructure. Each epic builds on previous. Stories are true vertical slices. Acceptance criteria include success conditions, error handling, and edge cases.

#### 7. Technical Guidance - PASS (95%)

✅ Technology stack specified: Node.js v24.5.0, Express, PostgreSQL, Redis, Docker
✅ Architecture direction provided
✅ Key technical decisions documented with rationale
✅ Integration points identified
✅ Testing requirements clear
✅ Security requirements documented
✅ Performance considerations addressed

**Strengths:** Technical Assumptions section provides clear direction. Trade-offs explained. Pragmatic choices documented.

#### 8. Cross-Functional Requirements - PASS (100%)

✅ Data model identified
✅ Database migrations planned
✅ Data retention policy specified
✅ External integrations documented
✅ API requirements clear
✅ Deployment approach defined
✅ Monitoring strategy outlined

**Strengths:** Schema changes tied to stories. Integration authentication documented. Operational requirements realistic for MVP.

#### 9. Clarity & Communication - PASS (100%)

✅ Document well-structured with clear sections
✅ Consistent terminology throughout
✅ Technical terms explained where necessary
✅ User-focused language in goals and requirements
✅ Acceptance criteria unambiguous and specific
✅ PRD written to docs/prd.md file

**Strengths:** Writing is clear and concise. Requirements balance business and technical language. Rationale sections explain "why" not just "what."

### MVP Scope Assessment

**Scope is appropriate** - balances ambitious goals with realistic 1-week timeline.

**Timeline realism:** 1-week MVP is ambitious but achievable for experienced developer with focused sprint (39 stories averaging 2-3 hours each).

### Technical Readiness

**Clarity of technical constraints:** Excellent - Node.js v24.5.0 specified, all major libraries identified, architecture pattern clear.

**Identified technical risks:**
1. Gemini API rate limiting - mitigation documented
2. Large document processing - mitigation documented
3. Email deliverability - acknowledged
4. Docker networking - validation planned
5. File lock detection - handling specified

### Recommendations

#### Next Steps

1. ✅ PRD written to docs/prd.md
2. Optional: Run `*shard-prd` for navigable structure
3. Hand off to Architect agent
4. UX Expert if needed for detailed mockups

### Final Decision

✅ **READY FOR ARCHITECT**

The PRD and epics are comprehensive, properly structured, and ready for architectural design. The architect has everything needed to design the technical implementation.

**Quality indicators:**
- All 9 checklist categories pass
- 39 fully-detailed user stories with acceptance criteria
- Clear technical direction without over-specification
- MVP scope realistic and well-justified
- Requirements tie back to user value and business goals

**Confidence level:** Very High

---

## Next Steps

### UX Expert Prompt

Based on the PRD UI Design Goals section, create detailed UI mockups and specifications for the ai.scanner web review interface. Focus on the document review page layout, confidence score visualization, approval form interaction, and responsive design for tablet devices. Ensure the design embodies "invisible and trustworthy" UX philosophy with clear information hierarchy and minimal friction for 10-15 second approval workflow.

### Architect Prompt

Create comprehensive technical architecture for ai.scanner based on docs/prd.md. Design the Node.js v24.5.0 microservices architecture with Docker Compose orchestration, define database schemas, specify API contracts, design the Gemini Vision integration with prompt engineering strategy, and document deployment architecture for multi-platform support (Linux/Windows/macOS). Address the technical decisions flagged in the PRD: queue implementation (BullMQ Lite vs custom), PDF processing library selection, and frontend framework choice.

---

*PRD v1.0 - Created 2025-10-03 using BMAD-METHOD™ framework*
