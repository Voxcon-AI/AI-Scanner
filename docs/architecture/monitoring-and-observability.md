# Monitoring and Observability

## Monitoring Stack

- **Frontend Monitoring:** Browser console errors logged to backend via POST `/api/logs` endpoint (captures JS errors, failed API calls) - deferred to post-MVP
- **Backend Monitoring:** Pino structured JSON logs to stdout (Docker captures and aggregates via `docker-compose logs`)
- **Error Tracking:** Sentry integration for production error aggregation and alerting - deferred to post-MVP
- **Performance Monitoring:** Custom metrics exposed via GET `/metrics` endpoints (Prometheus-compatible format for future Grafana dashboards)

**MVP Monitoring:**
- Pino logs with severity levels (debug, info, warn, error)
- Health check endpoints (`/health`, `/health/db`, `/health/redis`) for uptime monitoring
- Manual log review: `docker-compose logs -f --tail=100 worker` (tail recent worker logs)

## Key Metrics

**Frontend Metrics:**
- **Core Web Vitals:** (measured via Chrome DevTools, manual review)
  - LCP (Largest Contentful Paint): <2.5s
  - FID (First Input Delay): <100ms
  - CLS (Cumulative Layout Shift): <0.1
- **JavaScript Errors:** Count of unhandled exceptions (logged to console, captured manually)
- **API Response Times:** Measure via Network tab (target: <500ms for document fetch, <100ms for auth)
- **User Interactions:** Manual testing (count clicks to approve, measure time from email to approval)

**Backend Metrics (Exposed via GET /metrics):**
```javascript
// Example metrics output (Prometheus format)
// GET /metrics response:

# HELP documents_processed_total Total documents processed by status
# TYPE documents_processed_total counter
documents_processed_total{status="queued"} 150
documents_processed_total{status="processing"} 5
documents_processed_total{status="analyzed"} 120
documents_processed_total{status="filed"} 100
documents_processed_total{status="rejected"} 15
documents_processed_total{status="failed"} 5

# HELP gemini_api_requests_total Total Gemini API requests
# TYPE gemini_api_requests_total counter
gemini_api_requests_total{status="success"} 115
gemini_api_requests_total{status="failure"} 5

# HELP gemini_api_latency_ms Gemini API response time in milliseconds
# TYPE gemini_api_latency_ms histogram
gemini_api_latency_ms_bucket{le="1000"} 50
gemini_api_latency_ms_bucket{le="3000"} 100
gemini_api_latency_ms_bucket{le="5000"} 115
gemini_api_latency_ms_bucket{le="+Inf"} 120
gemini_api_latency_ms_sum 180000
gemini_api_latency_ms_count 120

# HELP email_batches_sent_total Total email batches sent
# TYPE email_batches_sent_total counter
email_batches_sent_total{status="sent"} 25
email_batches_sent_total{status="failed"} 2

# HELP file_operations_total Total file operations (move/copy)
# TYPE file_operations_total counter
file_operations_total{operation="move",status="success"} 95
file_operations_total{operation="move",status="failure"} 5

# HELP api_request_duration_ms API request duration in milliseconds
# TYPE api_request_duration_ms histogram
api_request_duration_ms_bucket{method="GET",path="/api/documents/:id",le="100"} 800
api_request_duration_ms_bucket{method="POST",path="/api/documents/:id/approve",le="500"} 150
```

**Metric Collection Implementation:**
```typescript
// services/api/src/utils/metrics.ts
class Metrics {
  private counters = new Map<string, number>();
  private histograms = new Map<string, number[]>();

  incrementCounter(name: string, labels: Record<string, string> = {}) {
    const key = this.serializeKey(name, labels);
    this.counters.set(key, (this.counters.get(key) || 0) + 1);
  }

  recordHistogram(name: string, value: number, labels: Record<string, string> = {}) {
    const key = this.serializeKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
  }

  private serializeKey(name: string, labels: Record<string, string>) {
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${name}{${labelStr}}`;
  }

  toPrometheus(): string {
    // Format as Prometheus exposition format
    // (Implementation omitted for brevity)
  }
}

export const metrics = new Metrics();

// Usage in worker service:
import { metrics } from './utils/metrics';

const startTime = Date.now();
const result = await geminiClient.generateContent(prompt);
metrics.recordHistogram('gemini_api_latency_ms', Date.now() - startTime);
metrics.incrementCounter('gemini_api_requests_total', { status: 'success' });
```

**Health Monitoring:**
- Manual checks: `curl http://localhost:3000/health` (should return 200 OK)
- Automated uptime monitoring (post-MVP): UptimeRobot or Pingdom pinging `/health` every 5 minutes
- Alert on 3 consecutive failures (email to admin)

---
