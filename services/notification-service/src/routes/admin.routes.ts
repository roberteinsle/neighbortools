import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';

const router = Router();
const adminController = new AdminController();

// GET /admin/smtp - Get SMTP configuration
router.get('/smtp', adminController.getSmtpConfig);

// PUT /admin/smtp - Update SMTP configuration
router.put('/smtp', adminController.updateSmtpConfig);

// POST /admin/smtp/test - Test SMTP configuration
router.post('/smtp/test', adminController.testSmtpConfig);

// GET /admin/email-logs - Get email logs
router.get('/email-logs', adminController.getEmailLogs);

// GET /admin/stats - Get notification statistics
router.get('/stats', adminController.getStats);

export { router as adminRouter };
