# Epic 6: Deployment & Documentation

**Epic Goal:** Finalize the complete Docker Compose deployment configuration with all services integrated, create comprehensive setup documentation including platform-specific instructions (Linux/Windows/macOS), provide example configuration files and sample external data sources, write troubleshooting guides, and validate end-to-end workflows across different platforms to ensure the system is production-ready for open-source release.

## Story 6.1: Complete Docker Compose Integration

**As a** system administrator,
**I want** fully integrated Docker Compose configuration with all services working together,
**so that** I can deploy entire system with single command.

### Acceptance Criteria

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

## Story 6.2: Environment Configuration and Secrets Management

**As a** system administrator,
**I want** clear configuration template with all required settings,
**so that** I can customize deployment for my environment.

### Acceptance Criteria

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

## Story 6.3: Sample Data Sources and Test Documents

**As a** new user,
**I want** example data sources and test documents,
**so that** I can quickly test system with realistic data.

### Acceptance Criteria

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

## Story 6.4: Setup Documentation and Installation Guide

**As a** new user,
**I want** clear step-by-step setup instructions,
**so that** I can install and configure system in under 15 minutes.

### Acceptance Criteria

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

## Story 6.5: Troubleshooting Guide and Common Issues

**As a** user encountering issues,
**I want** troubleshooting guide for common problems,
**so that** I can resolve issues without external support.

### Acceptance Criteria

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

## Story 6.6: Development Setup and Contributing Guide

**As a** developer wanting to contribute,
**I want** local development setup instructions,
**so that** I can run services locally and make code changes.

### Acceptance Criteria

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

## Story 6.7: End-to-End Testing and Platform Validation

**As a** project maintainer,
**I want** validated deployment on Linux, Windows, and macOS,
**so that** I can confidently release to users on all platforms.

### Acceptance Criteria

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

## Story 6.8: Release Preparation and Documentation Polish

**As a** project maintainer,
**I want** polished documentation and release assets,
**so that** open-source release makes strong first impression.

### Acceptance Criteria

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
