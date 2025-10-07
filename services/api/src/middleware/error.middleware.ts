import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  const requestId = (req as any).id || 'unknown';

  logger.error({ err, requestId, path: req.path }, 'Unhandled error');

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message,
      details: {},
      timestamp: new Date().toISOString(),
      requestId,
    },
  });
}
