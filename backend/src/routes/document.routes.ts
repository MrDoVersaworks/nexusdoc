import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import { documentUploadSchema, searchSchema, paginationSchema } from '../types';
import { MAX_FILE_SIZE_BYTES } from '../constants';
import { asyncHandler } from '../utils/asyncHandler';
import {
  uploadDocument,
  listDocuments,
  getDocument,
  deleteDocument,
} from '../services/document.service.js';
import { semanticSearch } from '../services/search.service.js';
import { cacheMiddleware, invalidateCache } from '../utils/cache.js';

const router = Router();

// Multer config — memory storage, size limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

// All document routes require auth and API rate limiting
router.use(authMiddleware);
router.use(apiRateLimiter);

// GET /api/documents
router.get('/', cacheMiddleware(60), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const parsed = paginationSchema.parse(req.query);

  const result = await listDocuments({
    userId,
    page: parsed.page,
    limit: parsed.limit,
    sort: parsed.sort,
    order: parsed.order,
  });

  res.status(200).json({
    success: true,
    data: result.documents,
    pagination: result.pagination,
  });
}));

// POST /api/documents
router.post(
  '/',
  upload.single('file'),
  validate(documentUploadSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId!;
    const { title } = req.body;

    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { code: 'ERR_DOC_NO_FILE', message: 'No file provided.' },
      });
      return;
    }

    const document = await uploadDocument({ userId, title, file: req.file });

    invalidateCache('/api/documents', userId);

    res.status(201).json({
      success: true,
      data: document,
    });
  })
);

// POST /api/documents/search
router.post(
  '/search',
  validate(searchSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId!;
    const { query } = req.body;

    const results = await semanticSearch(userId, query);

    res.status(200).json({
      success: true,
      data: results,
    });
  })
);

// GET /api/documents/:id
router.get('/:id', cacheMiddleware(60), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const documentId = req.params.id;

  const document = await getDocument(userId, documentId);

  res.status(200).json({
    success: true,
    data: document,
  });
}));

// DELETE /api/documents/:id
router.delete('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const documentId = req.params.id;

  await deleteDocument(userId, documentId);

  invalidateCache('/api/documents', userId);

  res.status(200).json({
    success: true,
    data: null,
  });
}));

export default router;
