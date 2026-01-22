import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';

const router = Router();
const authController = new AuthController();

// POST /auth/register - Register new user
router.post('/register', authController.register);

// POST /auth/login - Login user
router.post('/login', authController.login);

// POST /auth/logout - Logout user
router.post('/logout', authController.logout);

// POST /auth/refresh - Refresh access token
router.post('/refresh', authController.refresh);

// GET /auth/me - Get current user (requires auth header from gateway)
router.get('/me', authController.getCurrentUser);

export { router as authRouter };
