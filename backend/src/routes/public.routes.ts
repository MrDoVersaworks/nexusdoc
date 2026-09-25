import { Router, Request, Response, NextFunction } from 'express';
import { desc, eq } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { systemSettings, platformReviews } from '../db/schema.js';
import { apiRateLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { publicReviewSchema } from '../types/index.js';

const router = Router();

router.get('/settings', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settingsArray = await db.select().from(systemSettings).limit(1);
    const settings = settingsArray[0] || {
      google_analytics_id: null,
      termly_uuid: null,
      privacy_policy_content: null,
      terms_of_service_content: null,
    };
    res.status(200).json({ success: true, data: settings });
  } catch (error) { next(error); }
});

router.get('/reviews', async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reviews = await db.select().from(platformReviews)
      .where(eq(platformReviews.status, 'approved'))
      .orderBy(desc(platformReviews.created_at));
    res.status(200).json({ success: true, data: reviews });
  } catch (error) { next(error); }
});

router.post('/reviews', apiRateLimiter, validate(publicReviewSchema), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const [inserted] = await db.insert(platformReviews).values({
      name: req.body.name,
      profession: req.body.profession || 'User',
      rating: req.body.rating,
      feedback: req.body.feedback,
      status: 'pending',
    }).returning();
    res.status(201).json({
      success: true,
      data: { id: inserted.id, status: inserted.status, message: 'Review submitted for moderation.' },
    });
  } catch (error) { next(error); }
});

export default router;
