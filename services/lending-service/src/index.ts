import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { lendingRouter } from './routes/lending.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'lending-service' });
});

// Routes
app.use('/lendings', lendingRouter);

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
  console.log(`Lending Service running on port ${PORT}`);
});

export { app, prisma };
