# Epic 4: Email Notification System

**Epic Goal:** Create the batch email notification service that monitors for analyzed documents, implements a 15-second idle trigger to batch multiple scans into single email, generates HTML email summaries with document thumbnails and AI recommendations, and sends emails with unique review links for each document. This epic delivers the critical user notification layer that bridges AI analysis to human review.

## Story 4.1: Batch Trigger and Idle Detection

**As a** mailer service,
**I want** to detect when documents are analyzed and batch them with 15-second idle trigger,
**so that** users receive single summary email instead of inbox-spamming individual notifications.

### Acceptance Criteria

1. Mailer service runs as standalone Node.js process in Docker container
2. Service polls database every 2 seconds for documents with status="analyzed" and notified=false
3. When analyzed documents found, service starts 15-second idle timer
4. If new documents analyzed during 15-second window, timer resets (extends batch window)
5. When 15 seconds pass with no new analyzed documents, trigger batch email generation
6. Service updates documents.notified=true for all documents included in batch
7. Batch metadata stored in new batches table: id, document_ids (array), created_at, email_sent_at, status
8. Service logs INFO: "Batch triggered: {n} documents ready for notification"
9. Idle timeout configurable via BATCH_IDLE_TIMEOUT_MS environment variable (default 15000)
10. Service exposes GET /health endpoint returning 200 OK with last batch sent timestamp

## Story 4.2: Document Thumbnail Generation

**As a** mailer service,
**I want** to generate small thumbnail images of document first pages,
**so that** email includes visual preview helping users identify documents.

### Acceptance Criteria

1. For each document in batch, service generates thumbnail image from first page (200px width, maintain aspect ratio)
2. PDF documents: convert first page to image using pdf-to-img or similar, resize to thumbnail
3. Image documents: load original image, resize to thumbnail using sharp library
4. Thumbnails saved to temporary directory with filename: {document_id}\_thumb.png
5. Thumbnail generation timeout: 5 seconds per document, on failure use placeholder image (generic document icon)
6. Service includes fallback for corrupted/unreadable files: log WARNING and use placeholder
7. Thumbnails embedded in email as base64 data URIs (avoid external image hosting for MVP)
8. Base64 encoding size limited to 50KB per thumbnail (aggressive compression if needed)
9. Thumbnails cleaned up after email sent successfully (delete temp files)
10. Service logs DEBUG: "Generated thumbnail for document {id} ({size} bytes)"

## Story 4.3: HTML Email Template Generation

**As a** mailer service,
**I want** to generate HTML email with document summaries and review links,
**so that** users can quickly review AI recommendations and access web interface.

### Acceptance Criteria

1. Email template loaded from templates/batch-summary.html with mustache or handlebars templating
2. Template includes: batch summary header ("You have {n} documents ready for review"), document list, footer with settings link
3. Each document entry shows: thumbnail image, filename, detected document type, confidence score with color coding (green >80%, yellow 60-80%, red <60%), recommended folder path, recommended filename, "Review & Approve" button/link
4. Review link format: {WEB_UI_BASE_URL}/review/{document_id}?token={review_token}
5. Review token generated as short-lived JWT (4 hour expiration) signed with REVIEW_TOKEN_SECRET, payload includes: document_id, batch_id
6. Confidence score displayed prominently with visual indicator (colored badge or progress bar)
7. Email includes plain text fallback version with document list and review URLs (no HTML formatting)
8. Template supports dark mode with @media (prefers-color-scheme: dark) CSS rules
9. Email width constrained to 600px for compatibility across email clients
10. Template tested manually with Gmail, Outlook, Apple Mail preview during development

## Story 4.4: SMTP Email Delivery

**As a** mailer service,
**I want** to send batch summary emails via SMTP,
**so that** users receive notifications in their inbox.

### Acceptance Criteria

1. Nodemailer configured with SMTP settings from environment variables: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
2. Email sent with subject: "ai.scanner: {n} documents ready for review"
3. Recipient email address from NOTIFICATION_EMAIL environment variable (single user for MVP)
4. Email includes proper headers: From, To, Subject, Date, Message-ID
5. Service supports both authenticated SMTP (Gmail, SendGrid) and unauthenticated relay (local mail server)
6. Send timeout set to 30 seconds, on timeout mark batch as "send_failed" and log ERROR
7. On successful send, update batch status to "sent" and update email_sent_at timestamp
8. Failed send retries 3 times with exponential backoff (10s, 20s, 40s)
9. After 3 failed retries, batch marked "send_failed" and alert logged for manual investigation
10. Service logs INFO: "Batch email sent successfully to {recipient} ({n} documents)"

## Story 4.5: Email Delivery Error Handling

**As a** user,
**I want** system to handle email failures gracefully,
**so that** I don't lose document notifications if email is temporarily unavailable.

### Acceptance Criteria

1. SMTP connection errors caught and logged with ERROR level including specific error message
2. Transient errors (network timeout, temporary unavailable) trigger retry logic (Story 4.4 AC8)
3. Permanent errors (authentication failed, recipient invalid) logged as CRITICAL and batch marked "send_failed_permanent"
4. Service tracks failed batches in database for manual retry or alternative notification
5. GET /admin/failed-batches endpoint returns list of failed batches with error details (authenticated)
6. POST /admin/retry-batch/{id} endpoint allows manual retry of failed batch (authenticated)
7. If email fails after multiple retries, service logs actionable message: "Email delivery failed. Review documents at: {WEB_UI_URL}/pending"
8. Service continues processing new batches even if previous batch failed (don't block on failures)
9. Dashboard or health check endpoint shows email delivery success rate (successful sends / total attempts)
10. Alternative notification methods (webhook, Slack) noted as post-MVP enhancement

## Story 4.6: Batch Processing Metrics and Monitoring

**As a** system administrator,
**I want** visibility into batch processing performance and health,
**so that** I can troubleshoot issues and monitor system reliability.

### Acceptance Criteria

1. Service tracks metrics: total batches sent, average batch size, average idle time before trigger, failed sends
2. Metrics exposed via GET /metrics endpoint returning JSON with counters and averages
3. Service logs INFO summary for each batch: "Batch {id}: {n} documents, idle time {ms}ms, email sent in {ms}ms"
4. Database batches table stores: document_ids, created_at, triggered_at, email_sent_at, status, error_message
5. Batch history retained for 30 days (configurable), then auto-purged by scheduled cleanup job
6. Service tracks email send duration (from Nodemailer call to SMTP response) for performance monitoring
7. Slow sends (>10 seconds) logged as WARNING: "Slow email delivery: {duration}ms"
8. Service health check includes last successful batch timestamp and last error timestamp
9. Metrics include 24-hour rolling statistics: batches sent today, documents notified today, failure rate
10. Service exposes GET /admin/batches endpoint returning recent batch history with status (authenticated, paginated)

---
