-- Initial database schema for ai.scanner
-- Creates users, documents, processing_queue, and batches tables

-- Enable UUID extension for auto-generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Function: Auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Table: users
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to auto-update updated_at on users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Table: documents
-- ============================================
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    scan_path TEXT NOT NULL,
    scan_timestamp TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('queued', 'processing', 'analyzed', 'filed', 'rejected', 'failed')),
    analysis_result JSONB,
    destination_path TEXT,
    user_action VARCHAR(50) CHECK (user_action IN ('approved', 'rejected', 'edited')),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to auto-update updated_at on documents table
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Table: processing_queue
-- ============================================
CREATE TABLE processing_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    retry_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- ============================================
-- Table: batches
-- ============================================
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_ids UUID[] NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    triggered_at TIMESTAMP,
    email_sent_at TIMESTAMP,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'triggered', 'sent', 'send_failed')),
    error_message TEXT
);

-- ============================================
-- Indexes for query performance
-- ============================================

-- Optimize queries filtering by document status (e.g., WHERE status='analyzed')
CREATE INDEX idx_documents_status ON documents(status);

-- Optimize queries for user's reviewed documents
CREATE INDEX idx_documents_user_id ON documents(user_id);

-- Partial index: only index documents needing email notification
-- Optimizes email service query: WHERE status='analyzed' AND notified=false
CREATE INDEX idx_documents_notified ON documents(notified) WHERE status='analyzed';

-- Optimize queue job queries (e.g., worker polling for pending jobs)
CREATE INDEX idx_processing_queue_status ON processing_queue(status);

-- Optimize lookups by document ID in queue table
CREATE INDEX idx_processing_queue_document_id ON processing_queue(document_id);

-- Optimize batch processing queries
CREATE INDEX idx_batches_status ON batches(status);
