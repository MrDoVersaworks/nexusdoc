import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

async function main() {
  const root = join(process.cwd(), 'drizzle');
  const files = (await readdir(root)).filter((file) => /^\d{4}_.+\.sql$/.test(file)).sort();
  if (files.length === 0) throw new Error('No SQL migrations found.');

  const numbers = files.map((file) => Number(file.slice(0, 4)));
  numbers.forEach((number, index) => {
    if (index > 0 && number !== numbers[index - 1] + 1) {
      throw new Error(`Migration sequence gap: expected ${String(numbers[index - 1] + 1).padStart(4, '0')}, found ${String(number).padStart(4, '0')}.`);
    }
  });

  const migration = await readFile(join(root, files[files.length - 1]), 'utf8');
  for (const required of ['is_admin', 'users_email_lower_unique', 'storage_cleanup_tasks', 'platform_reviews', 'status']) {
    if (!migration.includes(required)) throw new Error(`Latest migration is missing required remediation marker: ${required}`);
  }

  const schema = await readFile(join(process.cwd(), 'src/db/schema.ts'), 'utf8');
  for (const required of ['is_admin', 'storageCleanupTasks', 'platformReviews']) {
    if (!schema.includes(required)) throw new Error(`Schema is missing required contract: ${required}`);
  }

  const vercelConfig = JSON.parse(
    await readFile(join(process.cwd(), 'vercel.json'), 'utf8'),
  ) as { framework?: string; buildCommand?: string; builds?: unknown };

  if (vercelConfig.framework !== 'express') {
    throw new Error('Vercel deployment must use the Express framework preset.');
  }

  if (!vercelConfig.buildCommand?.includes('npm run db:migrate')) {
    throw new Error('Vercel production build must execute npm run db:migrate.');
  }

  if (vercelConfig.builds !== undefined) {
    throw new Error('Legacy Vercel builds configuration must not be present because it bypasses buildCommand.');
  }

  console.log(`Migration/deployment contract verified: ${files.join(', ')}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
