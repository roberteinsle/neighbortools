import { PrismaClient, NotificationType } from '@prisma/client';
import type { Notification, PaginationParams, Language } from '@neighbortools/shared-types';
import { calculateOffset } from '@neighbortools/shared-utils';
import { EmailService } from './email.service.js';

const prisma = new PrismaClient();
const emailService = new EmailService();

interface SendNotificationInput {
  userId: string;
  userEmail: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  language?: Language;
  sendEmail?: boolean;
}

interface NotificationFilters {
  isRead?: boolean;
  type?: NotificationType;
}

// Template mapping for notification types
const TEMPLATE_MAP: Record<NotificationType, string> = {
  LENDING_REQUEST: 'lending-request',
  LENDING_APPROVED: 'lending-approved',
  LENDING_REJECTED: 'lending-rejected',
  LENDING_REMINDER: 'lending-reminder',
  LENDING_OVERDUE: 'lending-overdue',
  NEIGHBORHOOD_INVITE: 'neighborhood-invite',
  NEIGHBORHOOD_JOINED: 'neighborhood-joined',
  WELCOME: 'welcome',
  SYSTEM: 'system',
};

export class NotificationService {
  async listNotifications(
    userId: string,
    filters: NotificationFilters,
    params: PaginationParams
  ): Promise<{ notifications: Notification[]; total: number }> {
    const { skip, take } = calculateOffset(params);

    const where: any = { userId, ...filters };

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      notifications: notifications.map(this.mapToResponse),
      total,
    };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return this.mapToResponse(notification);
  }

  async markAllAsRead(userId: string): Promise<number> {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return result.count;
  }

  async deleteNotification(id: string, userId: string): Promise<void> {
    await prisma.notification.delete({
      where: { id },
    });
  }

  async sendNotification(input: SendNotificationInput): Promise<Notification> {
    const {
      userId,
      userEmail,
      type,
      title,
      message,
      data,
      language = 'EN',
      sendEmail = true,
    } = input;

    // Create in-app notification
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data || {},
      },
    });

    // Send email notification
    if (sendEmail && userEmail) {
      const templateKey = TEMPLATE_MAP[type];

      await emailService.sendEmail({
        to: userEmail,
        subject: title,
        templateKey,
        data: {
          title,
          message,
          ...data,
        },
        language,
      });
    }

    return this.mapToResponse(notification);
  }

  async sendEmailOnly(
    to: string,
    subject: string,
    templateKey: string,
    data: Record<string, any>,
    language: Language = 'EN'
  ): Promise<boolean> {
    return emailService.sendEmail({
      to,
      subject,
      templateKey,
      data,
      language,
    });
  }

  async scheduleNotification(
    userId: string,
    type: NotificationType,
    scheduledAt: Date,
    data?: Record<string, any>
  ): Promise<void> {
    const templateKey = TEMPLATE_MAP[type];

    await prisma.scheduledNotification.create({
      data: {
        userId,
        type,
        templateKey,
        data: data || {},
        scheduledAt,
      },
    });
  }

  private mapToResponse(notification: any): Notification {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt,
    };
  }
}
