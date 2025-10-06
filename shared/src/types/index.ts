// Shared TypeScript interfaces for ai.scanner

export interface Document {
  id: string;
  filename: string;
  filePath: string;
  status: 'pending' | 'analyzing' | 'analyzed' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

export interface ProcessingQueue {
  id: string;
  documentId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  createdAt: Date;
}

export interface Batch {
  id: string;
  documentIds: string[];
  status: 'pending' | 'sent';
  createdAt: Date;
  sentAt?: Date;
}

export interface AnalysisResult {
  documentId: string;
  suggestedFolder: string;
  confidence: number;
  reasoning: string;
  extractedData: Record<string, any>;
  createdAt: Date;
}
