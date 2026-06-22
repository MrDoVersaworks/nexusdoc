import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import authRoutes from './routes/auth.routes';
import documentRoutes from './routes/document.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import publicRoutes from './routes/public.routes.js';
import statsRoutes from './routes/stats.routes.js';
import adminRoutes from './routes/admin.routes.js';
import contactRoutes from './routes/contact.routes.js';

const app = express();

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================
app.use(helmet({
  contentSecurityPolicy: false, // Let the Next.js frontend handle CSP for rendering
  frameguard: { action: 'deny' }, // Prevent clickjacking
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }, // Strict Transport Security
}));
app.use(cors({
  origin: config.CORS_ORIGIN.includes(',')
    ? config.CORS_ORIGIN.split(',').map((o) => o.trim())
    : config.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ============================================================
// PARSING MIDDLEWARE
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ============================================================
// API ROUTES
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);

// ============================================================
// 404 HANDLER
// ============================================================
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ERR_NOT_FOUND',
      message: 'The requested endpoint does not exist.',
    },
  });
});

// ============================================================
// GLOBAL ERROR HANDLER (must be last)
// ============================================================
app.use(errorHandler);

// ============================================================
// START SERVER
// ============================================================
const PORT = parseInt(config.PORT, 10);

app.listen(PORT, () => {
  logger.info('SERVER', `NexusDoc API running on port ${PORT}`);
  logger.info('SERVER', `Environment: ${config.NODE_ENV}`);
  logger.info('SERVER', `CORS origin: ${config.CORS_ORIGIN}`);
});

export default app;
