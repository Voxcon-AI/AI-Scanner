# Security and Performance

## Security Requirements

**Frontend Security:**
- **CSP Headers:** `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;` (blocks XSS via inline scripts, allows data URIs for email thumbnails)
- **XSS Prevention:** All user input sanitized before rendering (use `textContent` instead of `innerHTML`, escape HTML entities in filenames)
- **Secure Storage:** JWT tokens stored in `localStorage` (alternative: `httpOnly` cookies for CSRF protection, but complicates frontend auth flow)

**Backend Security:**
- **Input Validation:** All API endpoints validate request bodies with JSON schema (joi or zod library), reject invalid input with 400 error
- **Rate Limiting:** API endpoints limited to 100 requests/minute per IP (express-rate-limit middleware), Gemini API limited to 15 requests/minute (internal token bucket)
- **CORS Policy:** `Access-Control-Allow-Origin: https://ai-scanner.local` (production), `http://localhost:3000` (development), no wildcard `*` allowed

**Authentication Security:**
- **Token Storage:** JWT in localStorage (frontend), never expose in URLs (use POST body or headers only)
- **Session Management:** 24-hour token expiration, no automatic refresh (user re-authenticates after expiration)
- **Password Policy:** Minimum 8 characters (configurable via env), bcrypt hashing with 10 rounds, no complexity requirements for MVP (future: add uppercase/number/symbol rules)

**File System Security:**
- **Path Validation:** All file paths validated against whitelist (scan folder, output folders), reject `../` traversal attempts
- **Permission Checks:** File operations fail gracefully if permissions denied, log ERROR with actionable message ("Check folder permissions: `chmod 755 /mnt/output-folders`")

## Performance Optimization

**Frontend Performance:**
- **Bundle Size Target:** <100KB total (JS + CSS), achieve via vanilla JS (no React), minimal dependencies, tree-shaking with esbuild
- **Loading Strategy:** Lazy-load document preview (fetch image only when in viewport), inline critical CSS (<5KB), async load non-critical JS
- **Caching Strategy:** Service worker for offline support (future), browser cache headers for static assets (1 year: `Cache-Control: public, max-age=31536000`), ETags for document previews

**Backend Performance:**
- **Response Time Target:** <100ms for API endpoints (excluding file I/O), <500ms for approval action (including file move), <5s for Gemini API call
- **Database Optimization:** Index on `documents.status` and `documents.notified` (partial index for email query), connection pooling (max 20 connections), query result caching in Redis (5-minute TTL)
- **Caching Strategy:** Redis cache for user sessions (30-minute TTL), document metadata (5-minute TTL), folder structure (1-hour TTL), Gemini rate limit counters (1-minute rolling window)

**Concurrency:**
- Worker service can scale to multiple instances (each consumes from shared Redis queue atomically)
- API service stateless (can run multiple instances behind load balancer—future)
- Database connection pooling prevents connection exhaustion (max 20 connections, queue requests if pool full)

**Resource Limits (Docker):**
```yaml
# docker-compose.yml excerpt
services:
  worker:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

---
