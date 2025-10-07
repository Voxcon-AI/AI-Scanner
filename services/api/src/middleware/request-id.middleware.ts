import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  (req as any).id = randomUUID();
  res.setHeader('X-Request-Id', (req as any).id);
  next();
}
