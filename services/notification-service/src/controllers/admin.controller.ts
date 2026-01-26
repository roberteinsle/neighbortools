import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { EmailService } from '../services/email.service.js';
import { successResponse, errorResponse, paginatedResponse, calculateOffset } from '@neighbortools/shared-utils';

const prisma = new PrismaClient();
const emailService = new EmailService();

export class AdminController {
  async getSmtpConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const userRole = req.headers['x-user-role'] as string;
      if (userRole !== 'ADMIN') {
        return res.status(403).json(errorResponse('Admin access required'));
      }

      const config = await prisma.smtpConfig.findFirst({
        where: { isActive: true },
      });

      if (!config) {
        // Return env-based config info (without password)
        if (process.env.SMTP_HOST) {
          return res.json(successResponse({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            user: process.env.SMTP_USER,
            fromEmail: process.env.SMTP_FROM,
            fromName: process.env.SMTP_FROM_NAME || 'NeighborTools',
            source: 'environment',
          }));
        }
        return res.json(successResponse(null, 'No SMTP configuration found'));
      }

      // Don't return password
      res.json(successResponse({
        id: config.id,
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.user,
        fromEmail: config.fromEmail,
        fromName: config.fromName,
        isActive: config.isActive,
        source: 'database',
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get SMTP config';
      res.status(500).json(errorResponse(message));
    }
  }

  async updateSmtpConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const userRole = req.headers['x-user-role'] as string;
      if (userRole !== 'ADMIN') {
        return res.status(403).json(errorResponse('Admin access required'));
      }

      const { host, port, secure, user, password, fromEmail, fromName } = req.body;

      if (!host || !port || !user || !password || !fromEmail) {
        return res.status(400).json(errorResponse('Missing required fields'));
      }

      // Deactivate existing configs
      await prisma.smtpConfig.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });

      // Create new config
      const config = await prisma.smtpConfig.create({
        data: {
          host,
          port,
          secure: secure || false,
          user,
          password,
          fromEmail,
          fromName: fromName || 'NeighborTools',
          isActive: true,
        },
      });

      // Clear transporter to use new config
      emailService.clearTransporter();

      res.json(successResponse({
        id: config.id,
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.user,
        fromEmail: config.fromEmail,
        fromName: config.fromName,
      }, 'SMTP configuration updated'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update SMTP config';
      res.status(500).json(errorResponse(message));
    }
  }

  async testSmtpConfig(req: Request, res: Response, next: NextFunction) {
    try {
      const userRole = req.headers['x-user-role'] as string;
      if (userRole !== 'ADMIN') {
        return res.status(403).json(errorResponse('Admin access required'));
      }

      const { recipient } = req.body;

      if (!recipient) {
        return res.status(400).json(errorResponse('Recipient email is required'));
      }

      // Send actual test email
      const result = await emailService.sendEmail({
        to: recipient,
        subject: 'NeighborTools - Test Email',
        templateKey: 'test-email',
        data: {
          appName: 'NeighborTools',
          timestamp: new Date().toLocaleString(),
        },
        language: 'EN',
      });

      if (result) {
        res.json(successResponse(null, 'Test email sent successfully'));
      } else {
        res.status(400).json(errorResponse('Failed to send test email. Check email logs for details.'));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send test email';
      res.status(500).json(errorResponse(message));
    }
  }

  async getEmailLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const userRole = req.headers['x-user-role'] as string;
      if (userRole !== 'ADMIN') {
        return res.status(403).json(errorResponse('Admin access required'));
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const status = req.query.status as string;

      const { skip, take } = calculateOffset({ page, pageSize });

      const where: any = {};
      if (status) {
        where.status = status;
      }

      const [logs, total] = await Promise.all([
        prisma.emailLog.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.emailLog.count({ where }),
      ]);

      res.json(successResponse(paginatedResponse(logs, total, { page, pageSize })));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get email logs';
      res.status(500).json(errorResponse(message));
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userRole = req.headers['x-user-role'] as string;
      if (userRole !== 'ADMIN') {
        return res.status(403).json(errorResponse('Admin access required'));
      }

      const [
        totalNotifications,
        unreadNotifications,
        emailsSent,
        emailsFailed,
        pendingScheduled,
      ] = await Promise.all([
        prisma.notification.count(),
        prisma.notification.count({ where: { isRead: false } }),
        prisma.emailLog.count({ where: { status: 'SENT' } }),
        prisma.emailLog.count({ where: { status: 'FAILED' } }),
        prisma.scheduledNotification.count({ where: { status: 'PENDING' } }),
      ]);

      res.json(successResponse({
        notifications: {
          total: totalNotifications,
          unread: unreadNotifications,
        },
        emails: {
          sent: emailsSent,
          failed: emailsFailed,
        },
        scheduled: {
          pending: pendingScheduled,
        },
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get stats';
      res.status(500).json(errorResponse(message));
    }
  }
}
