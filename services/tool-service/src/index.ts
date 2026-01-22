import express from 'express';
import cors from 'cors';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { toolRouter } from './routes/tool.routes.js';
import { categoryRouter } from './routes/category.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded images
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'tool-service' });
});

// Routes
app.use('/tools', toolRouter);
app.use('/categories', categoryRouter);

// Error handler
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`Tool Service running on port ${PORT}`);
});

export { app, prisma };
