# Multi-stage Dockerfile for API service
# Development stage: hot reload with tsx watch
# Production stage: runs TypeScript with tsx (not compiled)

# ============================================
# Development stage
# ============================================
FROM node:24.5.0-alpine AS development

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code (volume mount in dev overrides this)
COPY src ./src

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Development command (can be overridden by docker-compose)
CMD ["npm", "run", "dev"]

# ============================================
# Production stage
# ============================================
FROM node:24.5.0-alpine AS production

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files and install all dependencies (including tsx)
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install

# Copy source code
COPY src ./src

# Copy migrations (needed for startup migration execution)
COPY migrations ./migrations
COPY .migration.json ./

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Production command - run with tsx directly
CMD ["npx", "tsx", "src/index.ts"]
