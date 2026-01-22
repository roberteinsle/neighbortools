import { Request, Response, NextFunction } from 'express';
import { NotificationService } from '../services/notification.service.js';
import { successResponse, errorResponse, paginatedResponse } from '@neighbortools/shared-utils';

const notificationService = new NotificationService();

export class NotificationController {
  async listNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const isRead = req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined;

      const { notifications, total } = await notificationService.listNotifications(
        userId,
        { isRead },
        { page, pageSize }
      );

      res.json(successResponse(paginatedResponse(notifications, total, { page, pageSize })));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list notifications';
      res.status(500).json(errorResponse(message));
    }
  }

  async getUnreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const count = await notificationService.getUnreadCount(userId);
      res.json(successResponse({ unreadCount: count }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get unread count';
      res.status(500).json(errorResponse(message));
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const { id } = req.params;

      const notification = await notificationService.markAsRead(id, userId);
      res.json(successResponse(notification));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to mark as read';
      res.status(500).json(errorResponse(message));
    }
  }

  async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const count = await notificationService.markAllAsRead(userId);
      res.json(successResponse({ markedCount: count }, 'All notifications marked as read'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to mark all as read';
      res.status(500).json(errorResponse(message));
    }
  }

  async deleteNotification(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const { id } = req.params;

      await notificationService.deleteNotification(id, userId);
      res.json(successResponse(null, 'Notification deleted'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete notification';
      res.status(500).json(errorResponse(message));
    }
  }

  async sendNotification(req: Request, res: Response, next: NextFunction) {
    try {
      // This is an internal API - should be called by other services
      const { userId, userEmail, type, title, message, data, language, sendEmail } = req.body;

      if (!userId || !type || !title || !message) {
        return res.status(400).json(errorResponse('Missing required fields'));
      }

      const notification = await notificationService.sendNotification({
        userId,
        userEmail,
        type,
        title,
        message,
        data,
        language,
        sendEmail,
      });

      res.status(201).json(successResponse(notification, 'Notification sent'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send notification';
      res.status(500).json(errorResponse(message));
    }
  }

  async sendEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { to, subject, templateKey, data, language } = req.body;

      if (!to || !subject || !templateKey) {
        return res.status(400).json(errorResponse('Missing required fields'));
      }

      const success = await notificationService.sendEmailOnly(
        to,
        subject,
        templateKey,
        data || {},
        language
      );

      if (success) {
        res.json(successResponse(null, 'Email sent'));
      } else {
        res.status(500).json(errorResponse('Failed to send email'));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send email';
      res.status(500).json(errorResponse(message));
    }
  }
}
