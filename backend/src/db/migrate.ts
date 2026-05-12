import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import { config } from '../config';

async function runMigrations(): Promise<void> {
  const sql = neon(config.DATABASE_URL);
  const db = drizzle(sql);

  console.log('[MIGRATE] Running database migrations...');

  await migrate(db, { migrationsFolder: './drizzle' });

  console.log('[MIGRATE] Migrations completed successfully.');
  process.exit(0);
}

runMigrations().catch((error: unknown) => {
  console.error('[ERR_MIGRATION_FAILED] Migration failed:', error);
  process.exit(1);
});
