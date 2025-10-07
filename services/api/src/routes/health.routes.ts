import { Router, Request, Response } from 'express';
import { checkDbHealth } from '../utils/db.js';
import { checkRedisHealth } from '../utils/redis.js';

const router = Router();

// Basic health check
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
  });
});

// Database health check
router.get('/health/db', async (req: Request, res: Response) => {
  const isHealthy = await checkDbHealth();

  if (isHealthy) {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'database',
    });
  } else {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'database',
    });
  }
});

// Redis health check
router.get('/health/redis', async (req: Request, res: Response) => {
  const isHealthy = await checkRedisHealth();

  if (isHealthy) {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'redis',
    });
  } else {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'redis',
    });
  }
});

export default router;
