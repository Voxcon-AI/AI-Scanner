# Data Models

## Document Model

**Purpose:** Represents a scanned document throughout its lifecycle from detection through AI analysis to user approval and filing.

**Key Attributes:**
- `id` (UUID): Unique identifier for document, generated on detection
- `filename` (string): Original scanned filename (e.g., `invoice_20251003_143052.pdf`)
- `scan_path` (string): Absolute path to file in scan folder at detection time
- `scan_timestamp` (timestamp): When file was detected by watcher service
- `status` (enum): Current processing state—`queued`, `processing`, `analyzed`, `filed`, `rejected`, `failed`
- `analysis_result` (JSONB): Gemini API response with classification, confidence, extracted fields, reasoning
- `destination_path` (string, nullable): Final folder path after approval (null until user approves)
- `user_action` (string, nullable): User's action—`approved`, `rejected`, `edited` (null until user acts)
- `user_id` (UUID, nullable): Foreign key to User who reviewed document (null if not yet reviewed)
- `created_at` (timestamp): Record creation time
- `updated_at` (timestamp): Last modification time

**Relationships:**
- BelongsTo User (via `user_id`) - one document reviewed by one user
- HasMany ProcessingQueue entries (one document can have multiple retry attempts)

### TypeScript Interface

```typescript
interface Document {
  id: string; // UUID v4
  filename: string;
  scan_path: string;
  scan_timestamp: Date;
  status: 'queued' | 'processing' | 'analyzed' | 'filed' | 'rejected' | 'failed';
  analysis_result: AnalysisResult | null;
  destination_path: string | null;
  user_action: 'approved' | 'rejected' | 'edited' | null;
  user_id: string | null; // UUID reference to User
  created_at: Date;
  updated_at: Date;
}

interface AnalysisResult {
  document_type: string; // e.g., "Packing List", "Invoice", "Purchase Order"
  confidence_score: number; // 0-100
  extracted_fields: {
    vendor?: string;
    po_number?: string;
    date?: string;
    amount?: string;
    [key: string]: string | undefined; // Additional dynamic fields
  };
  recommended_folder_path: string;
  recommended_filename: string;
  reasoning: string; // 1-2 sentence AI explanation
  analyzed_at: string; // ISO 8601 timestamp
  is_partial_analysis: boolean; // true if document had 50+ pages
  total_pages?: number;
  analyzed_pages?: number;
}
```

---

## User Model

**Purpose:** Represents authenticated users who can review and approve document routing recommendations.

**Key Attributes:**
- `id` (UUID): Unique user identifier
- `username` (string, unique): Login username (email format optional for MVP)
- `password_hash` (string): bcrypt hash of password (never store plaintext)
- `created_at` (timestamp): Account creation time
- `updated_at` (timestamp): Last modification time

**Relationships:**
- HasMany Documents (via `user_id`) - one user can review multiple documents

### TypeScript Interface

```typescript
interface User {
  id: string; // UUID v4
  username: string; // Unique, min 3 chars
  password_hash: string; // bcrypt hashed, never exposed in API responses
  created_at: Date;
  updated_at: Date;
}

// API response type (excludes sensitive fields)
interface UserDTO {
  id: string;
  username: string;
  created_at: Date;
}
```

---

## ProcessingQueue Model

**Purpose:** Tracks document analysis jobs in Redis queue with retry state and error handling.

**Key Attributes:**
- `id` (UUID): Unique queue entry identifier
- `document_id` (UUID): Foreign key to Document being processed
- `status` (enum): Queue state—`pending`, `processing`, `completed`, `failed`
- `retry_count` (integer): Number of retry attempts (max 3)
- `error_message` (string, nullable): Error details if job failed
- `created_at` (timestamp): Job creation time
- `completed_at` (timestamp, nullable): Job completion time

**Relationships:**
- BelongsTo Document (via `document_id`) - each queue entry processes one document

### TypeScript Interface

```typescript
interface ProcessingQueue {
  id: string; // UUID v4
  document_id: string; // UUID reference to Document
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retry_count: number; // Default 0, max 3
  error_message: string | null;
  created_at: Date;
  completed_at: Date | null;
}

// Job payload structure for Redis queue
interface QueueJob {
  documentId: string; // UUID
  filename: string;
  scanPath: string;
  detectedAt: string; // ISO 8601 timestamp
  retryCount?: number; // Optional, defaults to 0
}
```

---

## Batch Model

**Purpose:** Groups multiple analyzed documents for batch email notifications (15-second idle trigger).

**Key Attributes:**
- `id` (UUID): Unique batch identifier
- `document_ids` (UUID[]): Array of document IDs included in this batch
- `created_at` (timestamp): When first document was analyzed (batch trigger started)
- `triggered_at` (timestamp): When idle timeout expired and email generation started
- `email_sent_at` (timestamp, nullable): When email successfully sent (null if failed)
- `status` (enum): Batch state—`pending`, `triggered`, `sent`, `send_failed`
- `error_message` (string, nullable): SMTP error details if send failed

**Relationships:**
- HasMany Documents (via `document_ids` array) - one batch contains multiple documents

### TypeScript Interface

```typescript
interface Batch {
  id: string; // UUID v4
  document_ids: string[]; // Array of Document UUIDs
  created_at: Date;
  triggered_at: Date | null;
  email_sent_at: Date | null;
  status: 'pending' | 'triggered' | 'sent' | 'send_failed';
  error_message: string | null;
}

// Email template data structure
interface BatchEmailData {
  batch_id: string;
  document_count: number;
  documents: Array<{
    id: string;
    filename: string;
    document_type: string;
    confidence_score: number;
    recommended_folder: string;
    recommended_filename: string;
    thumbnail_base64: string; // Data URI for inline image
    review_link: string; // {WEB_UI_BASE_URL}/review/{document_id}?token={jwt}
  }>;
}
```

---
