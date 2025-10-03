# Tech Stack

## Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.3+ | Type-safe frontend code | Shares type definitions with backend (data models in `shared/`), catches errors at compile time, excellent IDE support |
| Frontend Framework | Vanilla JavaScript | ES2022 | Lightweight UI with minimal dependencies | No framework overhead (React/Vue add 100KB+), faster load times (<2s on 3G), simple debugging, aligns with "invisible UI" goal |
| UI Component Library | Custom Components | N/A | Minimal component set (8 core) | PRD specifies custom design system, avoids Material-UI bloat (500KB+), full control over accessibility and branding |
| State Management | None (DOM-based) | N/A | Direct DOM manipulation for simple UI | No global state needed—each review page is isolated session, reduces complexity vs Redux/Zustand |
| Backend Language | TypeScript (transpiled to JS) | 5.3+ | Type-safe Node.js services | Shares types with frontend, prevents runtime errors in async code, excellent for API contracts |
| Backend Framework | Express.js | 4.18+ | Lightweight REST API server | Battle-tested, minimal overhead, middleware ecosystem (auth, CORS, logging), simpler than NestJS for MVP |
| API Style | REST | N/A | HTTP JSON endpoints | Simpler than GraphQL for CRUD operations, no complex queries needed, native browser fetch() support |
| Database | PostgreSQL | 16 | Relational storage for documents/users | ACID compliance for document state, JSONB for flexible analysis results, excellent Node.js drivers (pg), free and open-source |
| Cache | Redis | 7 | Queue + session cache + rate limiting | Fast in-memory storage (<1ms latency), BullMQ Lite integration, pub/sub for service coordination, persistence options for queue reliability |
| File Storage | Host File System | N/A | Network share mounting (NFS/SMB) | Zero cost, already exists in target environments, Docker volume mounts provide abstraction, aligns with compliance requirements (data stays on-premises) |
| Authentication | JWT (jsonwebtoken) | 9.0+ | Stateless auth tokens | RS256 signing for security, 24-hour expiration, no server-side session storage (scales horizontally), standard Bearer token pattern |
| Frontend Testing | Vitest | 1.0+ | Unit tests for utility functions | Faster than Jest (Vite-powered), ESM-native, good TypeScript support, minimal config |
| Backend Testing | Vitest + Supertest | 1.0+ / 6.3+ | Unit + integration tests for API/services | Supertest for HTTP endpoint testing, Vitest for service logic, unified test framework across frontend/backend |
| E2E Testing | Manual Testing | N/A | Browser workflow validation | Playwright/Cypress deferred to post-MVP (too much setup overhead), manual checklist sufficient for MVP |
| Build Tool | esbuild (via tsx) | 0.19+ | Fast TypeScript transpilation | 100x faster than tsc, single-command dev server (tsx watch), minimal config, builds entire backend in <1s |
| Bundler | None (for backend) / esbuild (for frontend) | N/A / 0.19+ | Frontend asset bundling | Backend uses Node.js native ESM (no bundling), frontend bundles to single JS file for performance |
| IaC Tool | Docker Compose | 2.0+ | Container orchestration | Declarative service definitions, one-command deployment, simpler than Terraform/Ansible for single-host setup |
| CI/CD | GitHub Actions | N/A | Automated testing + Docker builds | Free for open-source, YAML-based workflows, Docker Hub integration for image publishing |
| Monitoring | Pino (logging) + manual metrics | 8.16+ | Structured JSON logs to stdout | High-performance logging (50k logs/sec), integrates with Docker logs, post-MVP: Grafana/Prometheus for dashboards |
| Logging | Pino | 8.16+ | Structured JSON logs | Outputs to stdout (Docker captures), filterable by service/level, supports child loggers for request tracing |
| CSS Framework | Custom (Tailwind-inspired) | N/A | Utility classes for rapid styling | Inline styles + minimal CSS file, no build step for MVP, Tailwind color palette for accessibility-tested contrast |

**Notes:**
- **No ORM:** Using raw SQL with `pg` library instead of TypeORM/Prisma to reduce complexity and improve performance (ORMs add overhead for simple queries).
- **No frontend build step initially:** Development uses native ESM modules in browser, production bundles with esbuild for single request (trade-off: faster dev iteration vs optimized production).
- **Gemini API:** Official `@google/generative-ai` SDK (v0.1.3+) for multimodal analysis, configurable to swap models (Flash → Pro) via environment variable.

---
