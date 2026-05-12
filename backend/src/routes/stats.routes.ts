import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { StatsService } from '../services/stats.service';

const router = Router();

router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const stats = await StatsService.getUserStats(req.userId as string);
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
