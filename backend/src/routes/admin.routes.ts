import { Router, Request, Response, NextFunction } from 'express';
import { db } from '../db/connection.js';
import { contactMessages, systemSettings, platformReviews } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';
import { ownerMiddleware } from '../middleware/owner.js';
import { validate } from '../middleware/validate.js';
import { uuidParamSchema, adminSettingsSchema } from '../types/index.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();
router.use(authMiddleware);
router.use(ownerMiddleware);

function inboxDto(row: typeof contactMessages.$inferSelect) {
  return {
    id: row.id,
    name: row.sender_name,
    email: row.sender_email,
    message: row.message,
    isRead: row.is_read,
    aiScreeningPassed: row.ai_screening_passed,
    createdAt: row.created_at.toISOString(),
  };
}

function reviewDto(row: typeof platformReviews.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    profession: row.profession,
    rating: row.rating,
    feedback: row.feedback,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

router.get('/inbox', async (_req, res, next) => {
  try {
    const messages = await db.select().from(contactMessages).orderBy(desc(contactMessages.created_at));
    res.status(200).json({ success: true, data: messages.map(inboxDto) });
  } catch (error) { next(error); }
});

const inboxId = validate(uuidParamSchema, 'params');

async function setRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [updated] = await db.update(contactMessages).set({ is_read: req.body.isRead === true, }).where(eq(contactMessages.id, req.params.id)).returning();
    if (!updated) { next(new AppError('Message not found', 404)); return; }
    res.status(200).json({ success: true, data: inboxDto(updated) });
  } catch (error) { next(error); }
}

router.patch('/inbox/:id', inboxId, setRead);
// Backward-compatible alias while clients migrate.
router.patch('/inbox/:id/read', inboxId, async (req, res, next) => {
  req.body = { isRead: true };
  await setRead(req, res, next);
});

router.delete('/inbox/:id', inboxId, async (req, res, next) => {
  try {
    const [deleted] = await db.delete(contactMessages).where(eq(contactMessages.id, req.params.id)).returning();
    if (!deleted) { next(new AppError('Message not found', 404)); return; }
    res.status(200).json({ success: true, data: null });
  } catch (error) { next(error); }
});

router.get('/reviews', async (_req, res, next) => {
  try {
    const reviews = await db.select().from(platformReviews).orderBy(desc(platformReviews.created_at));
    res.status(200).json({ success: true, data: reviews.map(reviewDto) });
  } catch (error) { next(error); }
});

router.patch('/reviews/:id/approve', validate(uuidParamSchema, 'params'), async (req, res, next) => {
  try {
    const [updated] = await db.update(platformReviews).set({ status: 'approved', updated_at: new Date() })
      .where(eq(platformReviews.id, req.params.id)).returning();
    if (!updated) { next(new AppError('Review not found', 404)); return; }
    res.status(200).json({ success: true, data: reviewDto(updated) });
  } catch (error) { next(error); }
});

router.delete('/reviews/:id', validate(uuidParamSchema, 'params'), async (req, res, next) => {
  try {
    const [deleted] = await db.delete(platformReviews).where(eq(platformReviews.id, req.params.id)).returning();
    if (!deleted) { next(new AppError('Review not found', 404)); return; }
    res.status(200).json({ success: true, data: null });
  } catch (error) { next(error); }
});

router.get('/settings', async (_req, res, next) => {
  try {
    const settingsArray = await db.select().from(systemSettings).limit(1);
    const settings = settingsArray[0] || { google_analytics_id: '', termly_uuid: '', privacy_policy_content: null, terms_of_service_content: null };
    res.status(200).json({ success: true, data: settings });
  } catch (error) { next(error); }
});

router.put('/settings', validate(adminSettingsSchema), async (req, res, next) => {
  try {
    const { google_analytics_id, termly_uuid, privacy_policy_content, terms_of_service_content } = req.body;
    const settingsArray = await db.select().from(systemSettings).limit(1);
    let updated;
    if (settingsArray.length > 0) {
      [updated] = await db.update(systemSettings).set({
        google_analytics_id: google_analytics_id || null,
        termly_uuid: termly_uuid || null,
        privacy_policy_content: privacy_policy_content || null,
        terms_of_service_content: terms_of_service_content || null,
        updated_at: new Date(),
      }).where(eq(systemSettings.id, settingsArray[0].id)).returning();
    } else {
      [updated] = await db.insert(systemSettings).values({
        google_analytics_id: google_analytics_id || null,
        termly_uuid: termly_uuid || null,
        privacy_policy_content: privacy_policy_content || null,
        terms_of_service_content: terms_of_service_content || null,
      }).returning();
    }
    res.status(200).json({ success: true, data: updated });
  } catch (error) { next(error); }
});

export default router;
