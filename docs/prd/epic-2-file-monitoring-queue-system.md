# Epic 2: File Monitoring & Queue System

**Epic Goal:** Implement polling-based file system monitoring service that continuously watches the configured scan folder for new PDF and image files, detects file creation with stability checks to avoid processing incomplete files, and queues discovered documents into a lightweight processing queue backed by Redis or PostgreSQL. This epic delivers the system's "input pipeline" that feeds all downstream processing.

## Story 2.1: Polling-Based File Watcher Service

**As a** system,
**I want** continuous monitoring of scan folder using polling to detect new documents,
**so that** I can trigger processing pipeline when users scan documents.

### Acceptance Criteria

1. Watcher service runs as standalone Node.js process in Docker container
2. Scan folder path read from SCAN_FOLDER_PATH environment variable
3. Polling interval configurable via POLL_INTERVAL_MS environment variable (default 3000ms / 3 seconds)
4. Service maintains in-memory snapshot of folder contents (filenames and sizes) between polls
5. Each poll cycle compares current folder state to previous snapshot to detect new files
6. Only files with extensions .pdf, .png, .jpg, .jpeg, .tiff processed (case-insensitive)
7. Service starts successfully and logs "File watcher started, monitoring: {path}" on startup
8. Graceful shutdown stops polling loop on SIGTERM/SIGINT
9. Folder access errors (permissions, path not found) logged with ERROR level and service retries after 30 seconds
10. Service exposes GET /health endpoint returning 200 OK with last poll timestamp

## Story 2.2: File Stability Detection

**As a** system,
**I want** to detect when scanner has finished writing a file,
**so that** I don't process incomplete or locked documents.

### Acceptance Criteria

1. When new file detected, service records filename and file size in pending files map
2. On next poll cycle, service checks if file size has changed since last observation
3. File considered "stable" only after file size unchanged for 2 consecutive poll cycles (6 seconds with default 3s polling)
4. Stable files moved from pending map to "ready for processing" list
5. Files still being written remain in pending map for up to 10 poll cycles (30 seconds)
6. If file size still changing after 10 cycles, log WARNING and process anyway (assume slow scanner)
7. If file disappears from folder while pending, remove from pending map and log INFO message
8. File lock detection attempted by trying to open file in read mode before marking stable
9. If file locked, retry on next poll cycle without counting as stable observation
10. Stability check timeout configurable via FILE_STABILITY_TIMEOUT_MS environment variable

## Story 2.3: Lightweight Queue Implementation

**As a** worker service,
**I want** reliable queue for document processing jobs,
**so that** I can process documents asynchronously without losing jobs if service restarts.

### Acceptance Criteria

1. Queue implementation uses Redis Lists (LPUSH/RPOP) for job storage
2. Queue module exports addJob(documentData) and getNextJob() async functions
3. addJob() pushes JSON-serialized job to Redis list "ai-scanner:queue:pending"
4. Job payload includes: documentId (UUID), filename, scanPath, detectedAt (ISO timestamp)
5. getNextJob() pops job from Redis list atomically and returns deserialized object
6. If Redis unavailable, addJob() retries 3 times with exponential backoff (1s, 2s, 4s) then throws error
7. Queue length exposed via getQueueLength() function querying Redis LLEN
8. Failed jobs moved to "ai-scanner:queue:failed" list with error details for manual inspection
9. Queue module includes clearQueue() function for testing (removes all pending jobs)
10. Redis connection pooling configured with auto-reconnect on connection loss

## Story 2.4: Document Queue Integration

**As a** file watcher service,
**I want** to create queue jobs for stable files and track them in database,
**so that** worker service can process documents reliably.

### Acceptance Criteria

1. When file marked stable, watcher service generates UUID for document
2. Watcher inserts document record into PostgreSQL documents table with status "queued"
3. Document record includes: id (UUID), filename, scan_path (absolute path), scan_timestamp, status
4. After database insert, watcher calls queue.addJob() with document metadata
5. If database insert fails, log ERROR and skip queue insertion (don't queue without DB record)
6. If queue insertion fails after successful DB insert, update document status to "queue_failed" in database
7. Watcher logs INFO message: "Document queued: {filename} (id: {uuid})"
8. Duplicate file detection: if file with same filename already exists in DB with status "queued" or "processing", skip and log WARNING
9. Service tracks metrics: total files detected, files queued, files skipped (duplicates), queue errors
10. Metrics exposed via GET /metrics endpoint returning JSON with counter values

## Story 2.5: Worker Service Skeleton and Job Polling

**As a** worker service,
**I want** to continuously poll queue for new jobs,
**so that** I can process documents as they arrive.

### Acceptance Criteria

1. Worker service runs as standalone Node.js process in Docker container
2. Worker polls queue every 1 second using queue.getNextJob() (blocking with timeout preferred if Redis supports BRPOP)
3. When job received, worker updates document status to "processing" in database
4. Worker logs INFO message: "Processing document: {filename} (id: {uuid})"
5. Worker service supports graceful shutdown: stops polling and waits for current job to complete before exiting
6. If no jobs available, worker logs DEBUG message and continues polling (not spamming logs)
7. Worker handles queue connection errors by logging ERROR and retrying after 5 seconds
8. Worker exposes GET /health endpoint returning 200 OK with last job processed timestamp
9. Worker can be scaled to multiple instances (each polls independently, Redis RPOP is atomic)
10. For MVP, worker includes placeholder processDocument() async function that logs "TODO: analyze document" and marks status "pending_analysis"

---
