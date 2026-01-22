import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { successResponse, errorResponse } from '@neighbortools/shared-utils';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(successResponse(result, 'User registered successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      res.status(400).json(errorResponse(message));
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      res.json(successResponse(result, 'Login successful'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      res.status(401).json(errorResponse(message));
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      await authService.logout(userId);
      res.json(successResponse(null, 'Logged out successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Logout failed';
      res.status(500).json(errorResponse(message));
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json(errorResponse('Refresh token required'));
      }

      const result = await authService.refresh(refreshToken);
      res.json(successResponse(result));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Token refresh failed';
      res.status(401).json(errorResponse(message));
    }
  }

  async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const user = await authService.getUserById(userId);
      if (!user) {
        return res.status(404).json(errorResponse('User not found'));
      }

      res.json(successResponse(user));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get user';
      res.status(500).json(errorResponse(message));
    }
  }
}
