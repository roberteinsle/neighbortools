import express, { Express } from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { notificationRouter } from './routes/notification.routes.js';
import { adminRouter } from './routes/admin.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { SchedulerService } from './services/scheduler.service.js';

const app: Express = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'notification-service' });
});

// Routes
app.use('/notifications', notificationRouter);
app.use('/admin', adminRouter);

// Error handler
app.use(errorHandler);

// Initialize scheduler service
const schedulerService = new SchedulerService();

// Run scheduled notifications every minute
cron.schedule('* * * * *', async () => {
  try {
    await schedulerService.processScheduledNotifications();
  } catch (error) {
    console.error('Scheduler error:', error);
  }
});

// Check for overdue reminders every hour
cron.schedule('0 * * * *', async () => {
  try {
    await schedulerService.checkOverdueReminders();
  } catch (error) {
    console.error('Overdue check error:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
});

export { app, prisma };
