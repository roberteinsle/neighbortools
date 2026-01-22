import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service.js';
import { successResponse, errorResponse, paginatedResponse } from '@neighbortools/shared-utils';

const userService = new UserService();

export class UserController {
  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      // Check if requester is admin (header set by gateway)
      const userRole = req.headers['x-user-role'] as string;
      if (userRole !== 'ADMIN') {
        return res.status(403).json(errorResponse('Admin access required'));
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      const { users, total } = await userService.listUsers({ page, pageSize });
      res.json(successResponse(paginatedResponse(users, total, { page, pageSize })));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list users';
      res.status(500).json(errorResponse(message));
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const requesterId = req.headers['x-user-id'] as string;
      const userRole = req.headers['x-user-role'] as string;

      // Users can only access their own data unless admin
      if (id !== requesterId && userRole !== 'ADMIN') {
        return res.status(403).json(errorResponse('Access denied'));
      }

      const user = await userService.getUserById(id);
      if (!user) {
        return res.status(404).json(errorResponse('User not found'));
      }

      res.json(successResponse(user));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get user';
      res.status(500).json(errorResponse(message));
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const requesterId = req.headers['x-user-id'] as string;
      const userRole = req.headers['x-user-role'] as string;

      // Users can only update their own data unless admin
      if (id !== requesterId && userRole !== 'ADMIN') {
        return res.status(403).json(errorResponse('Access denied'));
      }

      const user = await userService.updateUser(id, req.body);
      res.json(successResponse(user, 'User updated successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user';
      res.status(500).json(errorResponse(message));
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userRole = req.headers['x-user-role'] as string;

      // Only admins can delete users
      if (userRole !== 'ADMIN') {
        return res.status(403).json(errorResponse('Admin access required'));
      }

      await userService.deleteUser(id);
      res.json(successResponse(null, 'User deleted successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete user';
      res.status(500).json(errorResponse(message));
    }
  }

  async getUserSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const requesterId = req.headers['x-user-id'] as string;

      if (id !== requesterId) {
        return res.status(403).json(errorResponse('Access denied'));
      }

      const settings = await userService.getUserSettings(id);
      res.json(successResponse(settings));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get settings';
      res.status(500).json(errorResponse(message));
    }
  }

  async updateUserSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const requesterId = req.headers['x-user-id'] as string;

      if (id !== requesterId) {
        return res.status(403).json(errorResponse('Access denied'));
      }

      const settings = await userService.updateUserSettings(id, req.body);
      res.json(successResponse(settings, 'Settings updated successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update settings';
      res.status(500).json(errorResponse(message));
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const requesterId = req.headers['x-user-id'] as string;

      if (id !== requesterId) {
        return res.status(403).json(errorResponse('Access denied'));
      }

      await userService.changePassword(id, req.body);
      res.json(successResponse(null, 'Password changed successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to change password';
      res.status(400).json(errorResponse(message));
    }
  }

  // Profile routes - use x-user-id header
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const user = await userService.getUserById(userId);
      if (!user) {
        return res.status(404).json(errorResponse('User not found'));
      }

      res.json(successResponse(user));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get profile';
      res.status(500).json(errorResponse(message));
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const user = await userService.updateUser(userId, req.body);
      res.json(successResponse(user, 'Profile updated successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      res.status(500).json(errorResponse(message));
    }
  }

  async changeProfilePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      await userService.changePassword(userId, req.body);
      res.json(successResponse(null, 'Password changed successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to change password';
      res.status(400).json(errorResponse(message));
    }
  }
}
