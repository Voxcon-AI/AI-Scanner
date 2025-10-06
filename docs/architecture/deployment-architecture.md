# Deployment Architecture

## Deployment Strategy

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

## CI/CD Pipeline

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

## Environments

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
