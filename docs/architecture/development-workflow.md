# Development Workflow

## Local Development Setup

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

## Environment Configuration

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
