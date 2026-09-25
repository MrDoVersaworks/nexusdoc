import { Router, Request, Response } from 'express';
import { asc, eq } from 'drizzle-orm';
import { del } from '@vercel/blob';
import { db } from '../db/connection.js';
import { storageCleanupTasks } from '../db/schema.js';
import { config } from '../config/index.js';

const router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
  if (!config.CRON_SECRET || req.headers.authorization !== `Bearer ${config.CRON_SECRET}`) {
    res.status(401).json({ success: false, error: { code: 'ERR_CRON_UNAUTHORIZED', message: 'Unauthorized cleanup request.' } });
    return;
  }
  if (!config.BLOB_READ_WRITE_TOKEN) {
    res.status(503).json({ success: false, error: { code: 'ERR_STORAGE_NOT_CONFIGURED', message: 'Blob storage is not configured.' } });
    return;
  }

  const tasks = await db.select().from(storageCleanupTasks).orderBy(asc(storageCleanupTasks.created_at)).limit(25);
  let cleaned = 0;
  let failed = 0;

  for (const task of tasks) {
    try {
      await del(task.blob_url, { token: config.BLOB_READ_WRITE_TOKEN });
      await db.delete(storageCleanupTasks).where(eq(storageCleanupTasks.id, task.id));
      cleaned += 1;
    } catch (error: unknown) {
      failed += 1;
      await db.update(storageCleanupTasks).set({
        attempts: task.attempts + 1,
        last_error: error instanceof Error ? error.message : String(error),
        updated_at: new Date(),
      }).where(eq(storageCleanupTasks.id, task.id));
    }
  }

  res.status(200).json({ success: true, data: { scanned: tasks.length, cleaned, failed } });
});

export default router;
