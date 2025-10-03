# Epic 1: Foundation & Authentication Infrastructure

**Epic Goal:** Establish the foundational project infrastructure including Node.js monorepo setup, Docker Compose orchestration, PostgreSQL database with schema, basic Express.js API with health check endpoint, and JWT-based authentication system. This epic delivers a fully deployable skeleton that validates the infrastructure works before adding business logic.

## Story 1.1: Project Initialization and Monorepo Setup

**As a** developer,
**I want** a properly initialized Node.js monorepo with shared workspace configuration,
**so that** all services can share common utilities and dependencies efficiently.

### Acceptance Criteria

1. Git repository initialized with .gitignore excluding node_modules, .env, and common Node.js artifacts
2. Root package.json configured with workspaces for services/ subdirectories (watcher, worker, api, mailer)
3. Node.js v24.5.0 specified in package.json engines field and .nvmrc file
4. Shared workspace created at shared/ directory with common utilities (logger config, constants, types)
5. ESLint and Prettier configured for consistent code formatting across all services
6. README.md includes project overview and links to setup documentation
7. LICENSE file added (MIT or Apache 2.0 for open source)
8. .env.example file created with placeholder values for all required environment variables

## Story 1.2: Docker Compose Infrastructure Setup

**As a** system administrator,
**I want** Docker Compose configuration that orchestrates all services with single command,
**so that** I can deploy the entire system without manual service management.

### Acceptance Criteria

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

## Story 1.3: PostgreSQL Database Schema and Migrations

**As a** developer,
**I want** PostgreSQL database with initial schema for users, documents, and queue,
**so that** services have persistent storage for application state.

### Acceptance Criteria

1. Database migration tool (node-pg-migrate) configured in api service
2. Initial migration creates users table with fields: id, username, password_hash, created_at, updated_at
3. Initial migration creates documents table with fields: id, filename, scan_path, scan_timestamp, status, analysis_result (JSONB), destination_path, user_action, user_id, created_at, updated_at
4. Initial migration creates processing_queue table with fields: id, document_id, status, retry_count, error_message, created_at, updated_at
5. Indexes created on documents.status, documents.user_id, processing_queue.status
6. Database connection pooling configured with max 20 connections
7. Migration runs automatically on api service startup if not already applied
8. Connection string read from DATABASE_URL environment variable
9. Database connection failure results in service failing to start with clear error message

## Story 1.4: Express.js API Service with Health Check

**As a** system operator,
**I want** basic Express.js API with health check endpoint,
**so that** I can verify the service is running and connected to dependencies.

### Acceptance Criteria

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

## Story 1.5: JWT Authentication System

**As a** user,
**I want** secure login with username and password,
**so that** only I can access document review interface and approve file operations.

### Acceptance Criteria

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
