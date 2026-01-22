import { PrismaClient } from '@prisma/client';
import { NotificationService } from './notification.service.js';

const prisma = new PrismaClient();
const notificationService = new NotificationService();

export class SchedulerService {
  async processScheduledNotifications(): Promise<number> {
    // Get pending notifications that are due
    const pendingNotifications = await prisma.scheduledNotification.findMany({
      where: {
        status: 'PENDING',
        scheduledAt: { lte: new Date() },
      },
      take: 100, // Process in batches
    });

    let processedCount = 0;

    for (const scheduled of pendingNotifications) {
      try {
        // Mark as processing
        await prisma.scheduledNotification.update({
          where: { id: scheduled.id },
          data: { status: 'PROCESSING' },
        });

        // TODO: Fetch user email from user service
        // For now, we'll just create the in-app notification
        const data = scheduled.data as Record<string, any>;

        await notificationService.sendNotification({
          userId: scheduled.userId,
          userEmail: data.userEmail || '',
          type: scheduled.type,
          title: data.title || 'Notification',
          message: data.message || '',
          data,
          language: data.language || 'EN',
          sendEmail: !!data.userEmail,
        });

        // Mark as completed
        await prisma.scheduledNotification.update({
          where: { id: scheduled.id },
          data: {
            status: 'COMPLETED',
            processedAt: new Date(),
          },
        });

        processedCount++;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Mark as failed
        await prisma.scheduledNotification.update({
          where: { id: scheduled.id },
          data: {
            status: 'FAILED',
            error: errorMessage,
            processedAt: new Date(),
          },
        });

        console.error(`Failed to process scheduled notification ${scheduled.id}:`, errorMessage);
      }
    }

    if (processedCount > 0) {
      console.log(`Processed ${processedCount} scheduled notifications`);
    }

    return processedCount;
  }

  async checkOverdueReminders(): Promise<number> {
    // This would typically call the lending service to check for overdue items
    // For now, we'll just log that the check happened
    console.log('Checking for overdue lending reminders...');

    // TODO: Implement HTTP call to lending service to get overdue items
    // Then create notifications for each overdue item

    return 0;
  }

  async cleanupOldNotifications(daysToKeep: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prisma.scheduledNotification.deleteMany({
      where: {
        status: { in: ['COMPLETED', 'FAILED'] },
        processedAt: { lt: cutoffDate },
      },
    });

    if (result.count > 0) {
      console.log(`Cleaned up ${result.count} old scheduled notifications`);
    }

    return result.count;
  }
}
