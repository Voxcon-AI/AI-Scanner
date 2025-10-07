import { createClient } from 'redis';
import { logger } from './logger.js';

export const redis = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redis.on('error', (err) => logger.error({ err }, 'Redis error'));

let isConnected = false;

async function ensureConnected() {
  if (!isConnected) {
    try {
      await redis.connect();
      isConnected = true;
      logger.info('Redis client connected');
    } catch (err) {
      logger.error({ err }, 'Failed to connect to Redis');
      throw err;
    }
  }
}

export async function checkRedisHealth(): Promise<boolean> {
  try {
    await ensureConnected();
    await redis.ping();
    return true;
  } catch (err) {
    logger.error({ err }, 'Redis health check failed');
    return false;
  }
}
