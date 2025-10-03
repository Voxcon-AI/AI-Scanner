# Requirements

## Functional Requirements

**FR1:** System SHALL monitor a configured network folder path for new PDF and image files (PNG, JPEG, TIFF), detecting file creation events in real-time

**FR2:** System SHALL trigger AI analysis pipeline when new file is detected, queuing document for batch processing

**FR3:** System SHALL implement 15-second idle trigger that sends batch summary email after 15 seconds of no new scan activity

**FR4:** System SHALL extract text from documents using OCR and send both image and text to Gemini Vision API for multimodal analysis

**FR5:** System SHALL provide Gemini API with external data sources (PO logs CSV, vendor lists CSV, folder structure JSON) as context for reasoning

**FR6:** System SHALL receive structured output from Gemini containing: document type classification, extracted key fields (vendor, PO#, date, etc.), recommended folder path, recommended filename, confidence score (0-100%), and reasoning explanation

**FR7:** System SHALL detect documents with 50+ pages and process only first 5 pages, providing page count context to AI model

**FR8:** System SHALL generate HTML email summary containing: list of pending documents, thumbnail images, AI recommendations, confidence scores, and unique web links to review interface for each document

**FR9:** System SHALL provide web review interface displaying: document preview (scrollable full PDF/image), AI analysis digest, recommended destination folder path, editable filename field, confidence score, and approve/reject buttons

**FR10:** System SHALL require user authentication to access web review interface using JWT session tokens

**FR11:** System SHALL allow users to edit recommended filename and folder path before approval

**FR12:** System SHALL execute file operation (move or copy) from scan folder to user-approved destination with user-confirmed filename only after explicit approval action

**FR13:** System SHALL provide clear indication of proposed file operation before execution, showing source and destination paths

**FR14:** System SHALL update document status in queue after successful file operation, preventing duplicate processing

**FR15:** System SHALL handle network folder access for both Linux NFS and Windows SMB/CIFS shares

**FR16:** System SHALL log all processing activities (file detected, analysis started, analysis completed, user action, file operation result) with timestamps

**FR17:** System SHALL handle authentication via username/password login with JWT session management

**FR18:** System SHALL support configuration via .env file for: monitored folder path, output folder paths, email SMTP settings, Gemini API key, authentication secrets, external data source paths

**FR19:** System SHALL provide Docker Compose deployment with single-command startup including: application container, PostgreSQL database, and queue system (Redis or equivalent)

**FR20:** System SHALL maintain processing queue in database with document metadata: filename, scan timestamp, analysis status, AI recommendations, user actions, final destination

## Non-Functional Requirements

**NFR1:** System SHALL complete AI analysis for single-page document in <5 seconds and 50-page document in <15 seconds

**NFR2:** System SHALL support processing throughput of 100+ documents per day

**NFR3:** System SHALL run continuously for 7+ days without requiring restart or manual intervention

**NFR4:** System SHALL maintain zero data loss—no documents lost or corrupted during processing

**NFR5:** Web review interface SHALL be responsive and functional on tablet devices (iPad, Android tablets)

**NFR6:** System SHALL support modern evergreen browsers (Chrome, Firefox, Safari, Edge) for web interface

**NFR7:** System SHALL use HTTPS for web interface with self-signed certificate acceptable for MVP

**NFR8:** System SHALL implement session timeout for inactive users (configurable, default 30 minutes)

**NFR9:** System SHALL validate file system permissions before attempting file operations, providing clear error messages on failure

**NFR10:** System SHALL store API keys and authentication secrets securely via environment variables, never committed to source control

**NFR11:** System SHALL NOT store document content in database (privacy/compliance consideration)—only metadata and file paths

**NFR12:** Gemini API usage SHALL aim to stay within free tier limits (15 requests/minute) with rate limiting implemented

**NFR13:** System SHALL provide installation and configuration documentation enabling non-technical users to complete setup in <15 minutes

**NFR14:** System SHALL handle file lock detection and implement retry logic for files being written by scanner

**NFR15:** System SHALL be deployable on Linux (primary), Windows (via Docker Desktop), and macOS (via Docker Desktop)

---
