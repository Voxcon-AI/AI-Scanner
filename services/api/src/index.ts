import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger.js';
import { testConnection } from './utils/db.js';
import { runMigrations } from './utils/migrate.js';
import { setupGracefulShutdown } from './utils/shutdown.js';
import { requestIdMiddleware } from './middleware/request-id.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import healthRoutes from './routes/health.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
    credentials: true,
  })
);

// Body parser
app.use(express.json({ limit: '10mb' }));

// Request ID middleware
app.use(requestIdMiddleware);

// Request logging
app.use(
  pinoHttp({
    logger,
    customLogLevel: (req, res, err) => {
      if (res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    customSuccessMessage: (req, res) => {
      return `${req.method} ${req.url} ${res.statusCode}`;
    },
  })
);

// Routes
app.use(healthRoutes);

// Placeholder routes (will be implemented in future stories)
app.get('/api/documents', (req, res) => {
  res.json({ message: 'Documents endpoint - coming soon' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Startup sequence
async function startServer() {
  try {
    logger.info('Starting API service...');

    // Step 1: Test database connection
    await testConnection();

    // Step 2: Run migrations
    await runMigrations();

    // Step 3: Start Express server
    const server = app.listen(PORT, () => {
      logger.info({ port: PORT }, `API service listening on port ${PORT}`);
      logger.info(`Health check available at http://localhost:${PORT}/health`);
    });

    // Setup graceful shutdown handlers
    setupGracefulShutdown(server);
  } catch (err) {
    logger.error({ err }, 'Failed to start API service');
    process.exit(1);
  }
}

// Start the server
startServer();
