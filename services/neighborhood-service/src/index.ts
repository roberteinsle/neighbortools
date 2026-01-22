import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { neighborhoodRouter } from './routes/neighborhood.routes.js';
import { memberRouter } from './routes/member.routes.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'neighborhood-service' });
});

// Routes
app.use('/neighborhoods', neighborhoodRouter);
app.use('/members', memberRouter);

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
  console.log(`Neighborhood Service running on port ${PORT}`);
});

export { app, prisma };
