import { Server } from 'http';
import { logger } from './logger.js';
import { pool } from './db.js';
import { redis } from './redis.js';

export function setupGracefulShutdown(server: Server) {
  const gracefulShutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received');

    // Set timeout to force exit if cleanup takes too long
    const forceExitTimeout = setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);

    try {
      // Stop accepting new requests
      server.close(() => {
        logger.info('HTTP server closed');
      });

      // Close database connections
      await pool.end();
      logger.info('Database pool closed');

      // Close Redis connection
      await redis.quit();
      logger.info('Redis connection closed');

      clearTimeout(forceExitTimeout);
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
      clearTimeout(forceExitTimeout);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}
