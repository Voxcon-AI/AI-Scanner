# Unified Project Structure

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
