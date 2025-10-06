// Shared constants and enums for ai.scanner

export const MAX_RETRY_COUNT = 3;
export const DEFAULT_POLL_INTERVAL = 5000; // 5 seconds
export const FILE_STABILITY_DELAY = 2000; // 2 seconds

export enum ErrorCodes {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
}

export enum DocumentStatus {
  PENDING = 'pending',
  ANALYZING = 'analyzing',
  ANALYZED = 'analyzed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
