import { Request, Response, NextFunction } from 'express';
import { LendingService } from '../services/lending.service.js';
import { successResponse, errorResponse, paginatedResponse } from '@neighbortools/shared-utils';

const lendingService = new LendingService();

export class LendingController {
  async listLendings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const role = (req.query.role as 'borrower' | 'lender' | 'all') || 'all';
      const status = req.query.status as any;

      const filters = {
        ...(status && { status }),
      };

      const { lendings, total } = await lendingService.listLendings(
        userId,
        role,
        filters,
        { page, pageSize }
      );

      res.json(successResponse(paginatedResponse(lendings, total, { page, pageSize })));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list lendings';
      res.status(500).json(errorResponse(message));
    }
  }

  async createLending(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const { toolId, toolName, lenderId, neighborhoodId, startDate, endDate, message } = req.body;

      if (!toolId || !toolName || !lenderId || !neighborhoodId || !startDate || !endDate) {
        return res.status(400).json(errorResponse('Missing required fields'));
      }

      if (userId === lenderId) {
        return res.status(400).json(errorResponse('Cannot borrow your own tool'));
      }

      const lending = await lendingService.createLending({
        toolId,
        toolName,
        borrowerId: userId,
        lenderId,
        neighborhoodId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        message,
      });

      res.status(201).json(successResponse(lending, 'Lending request created successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create lending';
      res.status(400).json(errorResponse(message));
    }
  }

  async getLendingById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const { id } = req.params;

      // Check access
      const canAccess = await lendingService.canUserAccessLending(id, userId);
      if (!canAccess) {
        return res.status(403).json(errorResponse('Access denied'));
      }

      const lending = await lendingService.getLendingById(id);
      if (!lending) {
        return res.status(404).json(errorResponse('Lending not found'));
      }

      res.json(successResponse(lending));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get lending';
      res.status(500).json(errorResponse(message));
    }
  }

  async approveLending(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const { id } = req.params;

      const lending = await lendingService.approveLending(id, userId);
      res.json(successResponse(lending, 'Lending request approved'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to approve lending';
      res.status(400).json(errorResponse(message));
    }
  }

  async rejectLending(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const { id } = req.params;
      const { reason } = req.body;

      const lending = await lendingService.rejectLending(id, userId, reason);
      res.json(successResponse(lending, 'Lending request rejected'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to reject lending';
      res.status(400).json(errorResponse(message));
    }
  }

  async cancelLending(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const { id } = req.params;

      const lending = await lendingService.cancelLending(id, userId);
      res.json(successResponse(lending, 'Lending request cancelled'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to cancel lending';
      res.status(400).json(errorResponse(message));
    }
  }

  async startLending(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const { id } = req.params;

      const lending = await lendingService.startLending(id, userId);
      res.json(successResponse(lending, 'Lending started - tool picked up'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to start lending';
      res.status(400).json(errorResponse(message));
    }
  }

  async returnLending(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const { id } = req.params;
      const { note } = req.body;

      const lending = await lendingService.returnLending(id, userId, note);
      res.json(successResponse(lending, 'Tool returned successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to return lending';
      res.status(400).json(errorResponse(message));
    }
  }

  async extendLending(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const { id } = req.params;
      const { newEndDate } = req.body;

      if (!newEndDate) {
        return res.status(400).json(errorResponse('New end date is required'));
      }

      const lending = await lendingService.extendLending(id, userId, new Date(newEndDate));
      res.json(successResponse(lending, 'Lending extended successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to extend lending';
      res.status(400).json(errorResponse(message));
    }
  }

  async getLendingHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const { id } = req.params;

      // Check access
      const canAccess = await lendingService.canUserAccessLending(id, userId);
      if (!canAccess) {
        return res.status(403).json(errorResponse('Access denied'));
      }

      const history = await lendingService.getLendingHistory(id);
      res.json(successResponse(history));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get history';
      res.status(500).json(errorResponse(message));
    }
  }

  async getLendingsByTool(req: Request, res: Response, next: NextFunction) {
    try {
      const { toolId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      const { lendings, total } = await lendingService.getLendingsByTool(toolId, { page, pageSize });
      res.json(successResponse(paginatedResponse(lendings, total, { page, pageSize })));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get lendings';
      res.status(500).json(errorResponse(message));
    }
  }

  async getLendingsByNeighborhood(req: Request, res: Response, next: NextFunction) {
    try {
      const { neighborhoodId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      const { lendings, total } = await lendingService.getLendingsByNeighborhood(
        neighborhoodId,
        { page, pageSize }
      );
      res.json(successResponse(paginatedResponse(lendings, total, { page, pageSize })));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get lendings';
      res.status(500).json(errorResponse(message));
    }
  }

  async getUserStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const stats = await lendingService.getUserStats(userId);
      res.json(successResponse(stats));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get stats';
      res.status(500).json(errorResponse(message));
    }
  }
}
