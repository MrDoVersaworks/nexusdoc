import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth';
import { apiRateLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import { documentUploadSchema, searchSchema, paginationSchema, uuidParamSchema } from '../types';
import { MAX_FILE_SIZE_BYTES } from '../constants';
import { asyncHandler } from '../utils/asyncHandler';
import { uploadDocument, listDocuments, getDocument, deleteDocument, downloadDocument } from '../services/document.service.js';
import { semanticSearch } from '../services/search.service.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_SIZE_BYTES } });

router.use(authMiddleware);
router.use(apiRateLimiter);

router.get('/', validate(paginationSchema, 'query'), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await listDocuments({
    userId: req.userId!,
    page: Number(req.query.page),
    limit: Number(req.query.limit),
    sort: String(req.query.sort),
    order: String(req.query.order),
  });
  res.status(200).json({ success: true, data: result.documents, pagination: result.pagination });
}));

router.post('/', upload.single('file'), validate(documentUploadSchema), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ success: false, error: { code: 'ERR_DOC_NO_FILE', message: 'No file provided.' } });
    return;
  }
  const document = await uploadDocument({ userId: req.userId!, title: req.body.title, file: req.file });
  res.status(201).json({ success: true, data: document });
}));

router.post('/search', validate(searchSchema), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const results = await semanticSearch(req.userId!, req.body.query);
  res.status(200).json({ success: true, data: results });
}));

router.get('/:id', validate(uuidParamSchema, 'params'), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const document = await getDocument(req.userId!, req.params.id);
  res.status(200).json({ success: true, data: document });
}));

router.get('/:id/download', validate(uuidParamSchema, 'params'), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await downloadDocument(req.userId!, req.params.id, res);
}));

router.delete('/:id', validate(uuidParamSchema, 'params'), asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await deleteDocument(req.userId!, req.params.id);
  res.status(200).json({ success: true, data: null });
}));

export default router;
