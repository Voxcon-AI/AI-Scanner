import { Pool } from 'pg';

// Database connection pool configuration
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of connections in pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection cannot be established
});

// Handle unexpected database errors
// Forces container restart via process exit, allowing Docker restart policy to recover
pool.on('error', (err) => {
  console.error('Unexpected database error:', err);
  process.exit(-1);
});

/**
 * Health check function for /health endpoint
 * Tests database connectivity with simple query
 */
export async function checkDbHealth(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (err) {
    console.error('Database health check failed:', err);
    return false;
  }
}

/**
 * Test database connection on startup
 * Throws error if connection fails, preventing service from starting
 */
export async function testConnection(): Promise<void> {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✓ Database connection established');
  } catch (err) {
    // Mask password in connection string for security
    const maskedUrl = process.env.DATABASE_URL?.replace(/:([^@]+)@/, ':***@') || 'NOT_SET';
    console.error(`✗ Failed to connect to database: ${maskedUrl}`);
    console.error('Error:', err);
    throw new Error('Failed to connect to database. Check DATABASE_URL environment variable.');
  }
}
