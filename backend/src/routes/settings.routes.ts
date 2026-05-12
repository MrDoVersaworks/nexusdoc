import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { aiSettingsSchema } from '../types';
import { asyncHandler } from '../utils/asyncHandler';
import {
  getAISettings,
  updateAISettings,
  deleteApiKey,
} from '../services/settings.service';

const router = Router();

// All settings routes require auth
router.use(authMiddleware);

// GET /api/settings
router.get('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const settings = await getAISettings(userId);

  res.status(200).json({
    success: true,
    data: settings,
  });
}));

// PUT /api/settings
router.put(
  '/',
  validate(aiSettingsSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId!;
    const { geminiApiKey, geminiModel, geminiEmbeddingModel } = req.body;

    const settings = await updateAISettings({
      userId,
      geminiApiKey,
      geminiModel,
      geminiEmbeddingModel,
    });

    res.status(200).json({
      success: true,
      data: settings,
    });
  })
);

// DELETE /api/settings/api-key
router.delete('/api-key', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  await deleteApiKey(userId);

  res.status(200).json({
    success: true,
    data: null,
  });
}));

export default router;
