import { Request, Response, NextFunction } from 'express';
import { NeighborhoodService } from '../services/neighborhood.service.js';
import { MemberService } from '../services/member.service.js';
import { successResponse, errorResponse, paginatedResponse } from '@neighbortools/shared-utils';

const neighborhoodService = new NeighborhoodService();
const memberService = new MemberService();

export class NeighborhoodController {
  async listNeighborhoods(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      const { neighborhoods, total } = await neighborhoodService.listNeighborhoodsForUser(
        userId,
        { page, pageSize }
      );

      res.json(successResponse(paginatedResponse(neighborhoods, total, { page, pageSize })));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list neighborhoods';
      res.status(500).json(errorResponse(message));
    }
  }

  async createNeighborhood(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json(errorResponse('Name is required'));
      }

      const neighborhood = await neighborhoodService.createNeighborhood(userId, {
        name,
        description,
      });

      res.status(201).json(successResponse(neighborhood, 'Neighborhood created successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create neighborhood';
      res.status(500).json(errorResponse(message));
    }
  }

  async getNeighborhoodById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const { id } = req.params;

      // Check if user is a member
      const isMember = await neighborhoodService.isMember(id, userId);
      if (!isMember) {
        return res.status(403).json(errorResponse('You are not a member of this neighborhood'));
      }

      const neighborhood = await neighborhoodService.getNeighborhoodById(id);
      if (!neighborhood) {
        return res.status(404).json(errorResponse('Neighborhood not found'));
      }

      res.json(successResponse(neighborhood));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get neighborhood';
      res.status(500).json(errorResponse(message));
    }
  }

  async updateNeighborhood(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const { id } = req.params;

      // Check if user is admin or owner
      const role = await neighborhoodService.getMemberRole(id, userId);
      if (!role || role === 'MEMBER') {
        return res.status(403).json(errorResponse('Admin or owner access required'));
      }

      const neighborhood = await neighborhoodService.updateNeighborhood(id, req.body);
      res.json(successResponse(neighborhood, 'Neighborhood updated successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update neighborhood';
      res.status(500).json(errorResponse(message));
    }
  }

  async deleteNeighborhood(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const { id } = req.params;

      // Check if user is owner
      const role = await neighborhoodService.getMemberRole(id, userId);
      if (role !== 'OWNER') {
        return res.status(403).json(errorResponse('Only the owner can delete the neighborhood'));
      }

      await neighborhoodService.deleteNeighborhood(id);
      res.json(successResponse(null, 'Neighborhood deleted successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete neighborhood';
      res.status(500).json(errorResponse(message));
    }
  }

  async joinNeighborhood(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const { inviteCode } = req.body;
      if (!inviteCode) {
        return res.status(400).json(errorResponse('Invite code is required'));
      }

      const neighborhood = await neighborhoodService.joinByInviteCode(userId, inviteCode);
      res.json(successResponse(neighborhood, 'Successfully joined neighborhood'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to join neighborhood';
      res.status(400).json(errorResponse(message));
    }
  }

  async leaveNeighborhood(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const { id } = req.params;

      await neighborhoodService.leaveNeighborhood(id, userId);
      res.json(successResponse(null, 'Successfully left neighborhood'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to leave neighborhood';
      res.status(400).json(errorResponse(message));
    }
  }

  async regenerateInviteCode(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const { id } = req.params;

      // Check if user is admin or owner
      const role = await neighborhoodService.getMemberRole(id, userId);
      if (!role || role === 'MEMBER') {
        return res.status(403).json(errorResponse('Admin or owner access required'));
      }

      const newCode = await neighborhoodService.regenerateInviteCode(id);
      res.json(successResponse({ inviteCode: newCode }, 'Invite code regenerated successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to regenerate invite code';
      res.status(500).json(errorResponse(message));
    }
  }

  async getMembers(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const { id } = req.params;

      // Check if user is a member
      const isMember = await neighborhoodService.isMember(id, userId);
      if (!isMember) {
        return res.status(403).json(errorResponse('You are not a member of this neighborhood'));
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      const { members, total } = await memberService.getMembers(id, { page, pageSize });
      res.json(successResponse(paginatedResponse(members, total, { page, pageSize })));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get members';
      res.status(500).json(errorResponse(message));
    }
  }
}
