import express from 'express';
import { runMigrations } from './utils/migrate.js';
import { testConnection, checkDbHealth } from './utils/db.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbHealthy = await checkDbHealth();

  if (dbHealthy) {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: 'connected',
    });
  } else {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: 'disconnected',
    });
  }
});

// Placeholder routes (will be implemented in future stories)
app.get('/api/documents', (req, res) => {
  res.json({ message: 'Documents endpoint - coming soon' });
});

// Startup sequence
async function startServer() {
  try {
    // Step 1: Test database connection
    console.log('Starting API service...');
    await testConnection();

    // Step 2: Run migrations
    await runMigrations();

    // Step 3: Start Express server
    app.listen(PORT, () => {
      console.log(`✓ API service listening on port ${PORT}`);
      console.log(`✓ Health check available at http://localhost:${PORT}/health`);
    });
  } catch (err) {
    console.error('✗ Failed to start API service:', err);
    process.exit(1);
  }
}

// Start the server
startServer();
