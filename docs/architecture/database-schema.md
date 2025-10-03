# Database Schema

## PostgreSQL Schema (SQL DDL)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL, -- bcrypt hash
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents table (core entity)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    scan_path TEXT NOT NULL, -- Absolute path to file in scan folder
    scan_timestamp TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('queued', 'processing', 'analyzed', 'filed', 'rejected', 'failed')),
    analysis_result JSONB, -- Structured AI response (document_type, confidence_score, extracted_fields, etc.)
    destination_path TEXT, -- Final file location after approval
    user_action VARCHAR(50) CHECK (user_action IN ('approved', 'rejected', 'edited')),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notified BOOLEAN DEFAULT FALSE, -- Has batch email been sent?
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_notified ON documents(notified) WHERE status = 'analyzed'; -- Partial index for email service

-- Processing queue table (tracks retry state)
CREATE TABLE processing_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_processing_queue_status ON processing_queue(status);
CREATE INDEX idx_processing_queue_document_id ON processing_queue(document_id);

-- Batches table (email notification groups)
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_ids UUID[] NOT NULL, -- Array of document IDs in this batch
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    triggered_at TIMESTAMP, -- When idle timeout expired
    email_sent_at TIMESTAMP, -- When email successfully sent
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'triggered', 'sent', 'send_failed')),
    error_message TEXT
);

CREATE INDEX idx_batches_status ON batches(status);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Schema Design Notes:**
- **JSONB for analysis_result:** Flexible schema for Gemini responses (field structure may evolve without migrations)
- **Partial index on notified:** Optimizes email service query (`WHERE status='analyzed' AND notified=false`) by indexing only relevant rows
- **ON DELETE CASCADE for processing_queue:** When document deleted, related queue entries auto-deleted (cleanup)
- **ON DELETE SET NULL for user_id:** Preserve document records even if user account deleted (audit trail)
- **UUID primary keys:** Enable distributed ID generation, avoid sequential ID enumeration attacks
- **CHECK constraints:** Enforce valid enum values at database level (redundant with app validation for data integrity)

**Migration Strategy:**
- Use `node-pg-migrate` library for version-controlled schema changes
- Initial migration creates tables above
- Future migrations handled via numbered migration files (`001_initial_schema.sql`, `002_add_columns.sql`)
- Migrations run automatically on API service startup (`npm run migrate:up`)

---
