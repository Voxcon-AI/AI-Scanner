# Epic 3: AI Analysis Engine

**Epic Goal:** Build the AI-powered document analysis system that processes queued documents using Google Gemini Vision API. This includes loading and parsing external data sources (PO logs, vendor lists, folder structures), sending documents with multimodal prompts to Gemini for classification and reasoning, extracting structured recommendations with confidence scores, and handling large documents by processing only the first 5 pages. This epic delivers the core intelligence that transforms scanned documents into actionable routing recommendations.

## Story 3.1: External Data Source Loading

**As a** worker service,
**I want** to load external data sources (PO logs, vendor lists, folder structures) from CSV and JSON files,
**so that** AI can use contextual information for intelligent routing recommendations.

### Acceptance Criteria

1. Worker service loads data sources on startup from paths specified in environment variables: PO_LOGS_PATH, VENDOR_LIST_PATH, FOLDER_STRUCTURE_PATH
2. PO logs CSV parser reads file with columns: po_number, vendor_name, date, amount, status (using csv-parser library)
3. Vendor list CSV parser reads file with columns: vendor_id, vendor_name, aliases (comma-separated alternate names)
4. Folder structure JSON parser reads file with array of objects: {path, description, document_types[]}
5. Parsed data stored in memory as JavaScript objects/arrays for fast lookup during analysis
6. If data source file missing or malformed, log WARNING and continue with empty dataset (don't crash service)
7. Data sources refreshed via POST /admin/reload-data endpoint (authenticated, returns count of loaded records)
8. Service logs INFO with record counts: "Loaded {n} PO logs, {m} vendors, {k} folder paths"
9. Data sources reloaded on SIGHUP signal for runtime updates without restart
10. Data structures exposed via GET /admin/data-status endpoint showing last loaded timestamp and record counts

## Story 3.2: PDF and Image Processing

**As a** worker service,
**I want** to extract text from PDFs via OCR and convert pages to images,
**so that** I can send both visual and textual content to Gemini API.

### Acceptance Criteria

1. Worker detects file type by extension: .pdf uses PDF processing, .png/.jpg/.jpeg/.tiff uses image processing
2. PDF processing uses pdf-parse library to extract text content and page count
3. PDF with 50+ pages processes only first 5 pages, logs INFO: "Large document detected ({n} pages), processing first 5"
4. PDF pages converted to images using pdf-to-img or similar library (PNG format, 150 DPI)
5. For multi-page PDFs, first page image used for Gemini Vision, remaining pages' text concatenated
6. Image files read directly from disk as buffers for Gemini API
7. OCR performed by Gemini Vision (no separate OCR library needed for MVP)
8. Extracted text and page count included in document metadata stored in database
9. Processing handles corrupted files gracefully: log ERROR, update document status to "processing_failed", add to failed queue
10. Temporary image files cleaned up after analysis complete (use temp directory with auto-cleanup)

## Story 3.3: Gemini Vision API Integration

**As a** worker service,
**I want** to send document images and text to Gemini API with structured prompt,
**so that** I receive AI-powered classification and routing recommendations.

### Acceptance Criteria

1. Gemini client initialized using @google/generative-ai library with API key from GEMINI_API_KEY environment variable
2. Default model set to "gemini-1.5-flash" (configurable via GEMINI_MODEL environment variable)
3. Multimodal prompt includes: document image (first page), extracted OCR text, external data context (PO logs snippet, vendor list, folder structure)
4. Prompt template loaded from external file (prompts/analysis-prompt.txt) for easy customization
5. Prompt requests structured JSON output with fields: document_type, confidence_score (0-100), extracted_fields {vendor, po_number, date, etc.}, recommended_folder_path, recommended_filename, reasoning (1-2 sentences)
6. API request includes generation config: response_mime_type="application/json", temperature=0.2 (deterministic), max_output_tokens=2048
7. Rate limiting implemented: max 15 requests per minute using token bucket algorithm in Redis
8. If rate limit exceeded, worker queues job back with retry delay (60 seconds) and increments retry_count
9. API timeout set to 30 seconds, on timeout mark job for retry (max 3 retries)
10. API errors logged with ERROR level including error code, message, and document ID

## Story 3.4: Structured Response Parsing and Validation

**As a** worker service,
**I want** to parse and validate Gemini's JSON response,
**so that** I have reliable, well-formed recommendations for user review.

### Acceptance Criteria

1. Worker parses Gemini response as JSON, handles malformed JSON gracefully with try-catch
2. Response validator checks required fields present: document_type, confidence_score, recommended_folder_path, recommended_filename
3. Confidence score validated as number between 0-100, defaults to 50 if invalid
4. Recommended folder path validated against loaded folder structure, fallback to "/uncategorized" if invalid
5. Recommended filename sanitized: remove invalid characters (/, \, :, *, ?, ", <, >, |), replace spaces with underscores, ensure extension preserved
6. Extracted fields stored as JSONB in documents.analysis_result column
7. If validation fails, log WARNING with validation errors and use fallback values (don't fail entire job)
8. Reasoning text truncated to 500 characters if exceeds limit
9. Worker logs INFO: "Analysis complete: {document_type} (confidence: {score}%) -> {folder_path}/{filename}"
10. Parsed result structure matches schema expected by email and web UI services

## Story 3.5: Large Document Handling and Page Count Context

**As a** worker service,
**I want** to inform Gemini when processing large multi-page documents,
**so that** AI provides context-aware recommendations accounting for partial processing.

### Acceptance Criteria

1. When document has 50+ pages, prompt includes explicit context: "This is a {n}-page document. Only the first 5 pages are being analyzed."
2. Prompt requests AI to note if document appears incomplete or would benefit from full analysis
3. Database stores is_partial_analysis boolean flag for documents processed with page limit
4. Document metadata includes total_pages and analyzed_pages counts
5. Large document prompt template variant loaded from prompts/analysis-prompt-large.txt
6. Worker logs WARNING for documents exceeding 100 pages: "Very large document ({n} pages), analysis may be limited"
7. If first 5 pages are blank or unreadable, worker extends analysis to next 5 pages (up to 10 pages max)
8. Page count context included in reasoning explanation returned by AI
9. Web UI and email display page count info: "Analyzed 5 of 127 pages" for user awareness
10. Post-MVP: Consider adding "request full analysis" feature for large documents

## Story 3.6: Analysis Result Storage and Queue Completion

**As a** worker service,
**I want** to save analysis results to database and mark job complete,
**so that** downstream services can access recommendations and trigger notifications.

### Acceptance Criteria

1. After successful analysis, worker updates documents table: status="analyzed", analysis_result (JSONB with full response), updated_at (timestamp)
2. Analysis result includes: document_type, confidence_score, extracted_fields, recommended_folder_path, recommended_filename, reasoning, analyzed_at (ISO timestamp)
3. Worker removes job from processing queue (job considered complete)
4. If database update fails, retry 3 times with 1-second delay, then move job to failed queue
5. Worker updates processing_queue table: status="completed", completed_at (timestamp)
6. Worker emits event or updates flag triggering email service batch check (simple Redis pub/sub or database flag)
7. Worker logs INFO: "Document {id} analyzed successfully, triggering notification check"
8. Failed analysis updates document status to "analysis_failed", stores error message in analysis_result.error field
9. Worker tracks metrics: documents analyzed, average confidence score, analysis duration, failures
10. Metrics exposed via GET /metrics endpoint with rolling 24-hour statistics

---
