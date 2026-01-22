import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';
import { authMiddleware } from './middleware/auth.middleware.js';
import { setupProxyRoutes } from './routes/proxy.routes.js';
import { errorResponse } from '@neighbortools/shared-utils';

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

// API Documentation (placeholder)
app.get('/api-docs', (req, res) => {
  res.json({
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth/*',
      users: '/api/users/*',
      tools: '/api/tools/*',
      lendings: '/api/lendings/*',
      neighborhoods: '/api/neighborhoods/*',
    },
  });
});

// Public routes (no auth required) - paths relative to /api mount
const publicPaths = [
  '/auth/register',
  '/auth/login',
  '/auth/refresh',
];

// Auth middleware (skip for public paths)
app.use('/api', (req, res, next) => {
  const isPublicPath = publicPaths.some(path => req.path.startsWith(path));
  if (isPublicPath) {
    return next();
  }
  return authMiddleware(req, res, next);
});

// Setup proxy routes to microservices
setupProxyRoutes(app);

// 404 handler
app.use((req, res) => {
  res.status(404).json(errorResponse('Endpoint not found'));
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Gateway error:', err);
  res.status(500).json(errorResponse('Internal gateway error'));
});

// Start server
app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});

export { app };
