import { execSync } from 'child_process';

/**
 * Run database migrations on service startup
 * Executes node-pg-migrate to apply pending migrations
 */
export async function runMigrations(): Promise<void> {
  try {
    console.log('Running database migrations...');

    // Execute migration command synchronously to ensure migrations complete before app starts
    // Working directory must be service root where .migration.json is located
    const output = execSync('npm run migrate:up', {
      cwd: process.cwd(),
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    console.log('✓ Migrations completed successfully');
    if (output.trim()) {
      console.log(output);
    }
  } catch (err: any) {
    console.error('✗ Migration failed:', err.message);
    if (err.stdout) {
      console.error('stdout:', err.stdout.toString());
    }
    if (err.stderr) {
      console.error('stderr:', err.stderr.toString());
    }
    throw new Error('Database migration failed. Check migration files and DATABASE_URL.');
  }
}
