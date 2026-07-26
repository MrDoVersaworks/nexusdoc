import { Router, Request, Response, NextFunction } from 'express';
import { desc } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { systemSettings, platformReviews } from '../db/schema.js';

const router = Router();

router.get('/settings', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settingsArray = await db.select().from(systemSettings).limit(1);
    const settings = settingsArray[0] || { google_analytics_id: '', termly_uuid: '' };
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

router.get('/reviews', async (_req: Request, res: Response): Promise<void> => {
  try {
    const reviews = await db.select().from(platformReviews).orderBy(desc(platformReviews.created_at));
    res.status(200).json({ success: true, data: reviews });
  } catch (_err) {
    res.status(200).json({ success: true, data: [] });
  }
});

router.post('/reviews', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, profession, rating, feedback } = req.body;
    if (!name || !feedback) {
      res.status(400).json({ success: false, message: '[ERR_VALIDATION] Name and feedback are required.' });
      return;
    }
    const [inserted] = await db.insert(platformReviews).values({
      name: String(name).trim(),
      profession: profession ? String(profession).trim() : 'Verified User',
      rating: Number(rating) || 5,
      feedback: String(feedback).trim(),
    }).returning();
    res.status(201).json({ success: true, data: inserted });
  } catch (_err) {
    res.status(500).json({ success: false, message: '[ERR_REVIEW_POST_FAILED] Failed to post review.' });
  }
});

export default router;
