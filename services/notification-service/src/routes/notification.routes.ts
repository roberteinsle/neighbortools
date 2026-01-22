import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller.js';

const router: Router = Router();
const notificationController = new NotificationController();

// GET /notifications - List notifications for current user
router.get('/', notificationController.listNotifications);

// GET /notifications/unread-count - Get unread count
router.get('/unread-count', notificationController.getUnreadCount);

// PUT /notifications/:id/read - Mark notification as read
router.put('/:id/read', notificationController.markAsRead);

// PUT /notifications/read-all - Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);

// DELETE /notifications/:id - Delete notification
router.delete('/:id', notificationController.deleteNotification);

// POST /notifications/send - Send notification (internal API)
router.post('/send', notificationController.sendNotification);

// POST /notifications/send-email - Send email directly (internal API)
router.post('/send-email', notificationController.sendEmail);

export { router as notificationRouter };
