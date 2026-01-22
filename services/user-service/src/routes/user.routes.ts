import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';

const router = Router();
const userController = new UserController();

// Profile routes (use x-user-id header) - must be before /:id routes
router.get('/profile', userController.getProfile);
router.patch('/profile', userController.updateProfile);
router.post('/profile', userController.updateProfile); // POST as fallback for PATCH
router.post('/change-password', userController.changeProfilePassword);

// GET /users - List all users (admin only)
router.get('/', userController.listUsers);

// GET /users/:id - Get user by ID
router.get('/:id', userController.getUserById);

// PUT /users/:id - Update user
router.put('/:id', userController.updateUser);

// DELETE /users/:id - Delete user (admin only)
router.delete('/:id', userController.deleteUser);

// GET /users/:id/settings - Get user settings
router.get('/:id/settings', userController.getUserSettings);

// PUT /users/:id/settings - Update user settings
router.put('/:id/settings', userController.updateUserSettings);

// PUT /users/:id/password - Change password
router.put('/:id/password', userController.changePassword);

export { router as userRouter };
