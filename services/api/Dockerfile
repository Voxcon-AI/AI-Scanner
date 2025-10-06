# Multi-stage Dockerfile for API service
# Development stage: hot reload with tsx watch
# Production stage: compiled JavaScript with node

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

# Development command (can be overridden by docker-compose)
CMD ["npm", "run", "dev"]

# ============================================
# Build stage
# ============================================
FROM node:24.5.0-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
COPY tsconfig.json ./
RUN npm ci --only=production

# Copy source and build
COPY src ./src
RUN npm run build

# ============================================
# Production stage
# ============================================
FROM node:24.5.0-alpine AS production

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled JavaScript from build stage
COPY --from=build /app/dist ./dist

# Copy migrations (needed for startup migration execution)
COPY migrations ./migrations
COPY .migration.json ./

# Expose port
EXPOSE 3000

# Production command
CMD ["npm", "start"]
