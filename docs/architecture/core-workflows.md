# Core Workflows

## Workflow: End-to-End Document Processing

This sequence diagram illustrates the complete lifecycle of a scanned document from detection through AI analysis to user approval and final filing.

```mermaid
sequenceDiagram
    participant Scanner as Document Scanner
    participant FS as File System (Scan Folder)
    participant Watcher as File Watcher Service
    participant DB as PostgreSQL Database
    participant Queue as Redis Queue
    participant Worker as Analysis Worker
    participant Gemini as Gemini Vision API
    participant Mailer as Email Service
    participant SMTP as SMTP Server
    participant User as User (Email Client)
    participant Browser as Web Browser
    participant API as Express API

    Scanner->>FS: Save scanned document (invoice.pdf)

    loop Polling every 3s
        Watcher->>FS: Check for new files
    end

    Watcher->>FS: Detect new file: invoice.pdf
    Watcher->>Watcher: Check file stability (size unchanged for 6s)
    Watcher->>DB: INSERT document (status='queued')
    Watcher->>Queue: LPUSH job (documentId, filename, scanPath)

    Worker->>Queue: BRPOP job (blocking pop)
    Queue-->>Worker: Return job data
    Worker->>DB: UPDATE document (status='processing')
    Worker->>FS: Read invoice.pdf
    Worker->>Worker: Extract text (OCR via Gemini), generate thumbnail
    Worker->>Gemini: POST /generateContent (image + text + context)
    Gemini-->>Worker: Return JSON analysis (type, confidence, fields, recommendation)
    Worker->>Worker: Validate and parse response
    Worker->>DB: UPDATE document (status='analyzed', analysis_result=JSON)
    Worker->>Worker: Trigger notification check (Redis pub/sub)

    loop Poll DB every 2s
        Mailer->>DB: SELECT documents WHERE status='analyzed' AND notified=false
    end

    Mailer->>Mailer: Start 15s idle timer
    Note over Mailer: Wait 15s for more documents (batching)
    Mailer->>FS: Generate thumbnails for batch
    Mailer->>Mailer: Render HTML email template (Handlebars)
    Mailer->>SMTP: Send batch summary email (HTML + plain text)
    SMTP-->>User: Deliver email to inbox
    Mailer->>DB: UPDATE documents (notified=true), INSERT batch record

    User->>Browser: Click review link (/review/{docId}?token={jwt})
    Browser->>API: GET /api/documents/{docId} (with review token)
    API->>API: Validate review token (JWT signature + expiration)
    API->>DB: SELECT document WHERE id={docId}
    DB-->>API: Return document + analysis_result
    API-->>Browser: JSON response (document data)
    Browser->>Browser: Render document preview + AI analysis card

    User->>Browser: Review recommendation, click "Approve & File"
    Browser->>API: POST /api/documents/{docId}/approve (destination_folder, filename)
    API->>API: Validate JWT auth token
    API->>FS: Move file from scan_path to destination_folder/filename
    API->>DB: UPDATE document (status='filed', destination_path, user_action='approved')
    API-->>Browser: 200 OK (success message)
    Browser->>Browser: Show success confirmation, redirect after 2s
```

**Error Handling Paths (Not Shown Above):**

- **File Lock Detected:** Watcher retries stability check for up to 30 seconds, then marks document as `failed` with error message
- **Gemini API Timeout:** Worker retries job 3 times, then updates status to `analysis_failed`
- **SMTP Send Failure:** Mailer retries 3 times with exponential backoff, marks batch as `send_failed` for manual investigation
- **File Operation Failure (Approval):** API returns 500 error, frontend shows retry button, document stays in `analyzed` state

**Performance Optimizations:**

- Worker processes documents in parallel (multiple worker instances can run simultaneously)
- Frontend uses optimistic UI (shows success immediately while file operation completes in background)
- Batch email reduces SMTP overhead (single email for multiple documents vs individual emails)
- Redis blocking pop (`BRPOP`) eliminates polling overhead in worker (waits for job instead of checking every second)

---
