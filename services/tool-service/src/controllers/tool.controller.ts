import { Request, Response, NextFunction } from 'express';
import { ToolService } from '../services/tool.service.js';
import { ImageService } from '../services/image.service.js';
import { successResponse, errorResponse, paginatedResponse } from '@neighbortools/shared-utils';

const toolService = new ToolService();
const imageService = new ImageService();

export class ToolController {
  async listTools(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      const filters = {
        neighborhoodId: req.query.neighborhoodId as string,
        category: req.query.category as any,
        condition: req.query.condition as any,
        isAvailable: req.query.isAvailable === 'true' ? true : req.query.isAvailable === 'false' ? false : undefined,
        search: req.query.search as string,
      };

      const { tools, total } = await toolService.listTools(filters, { page, pageSize });
      res.json(successResponse(paginatedResponse(tools, total, { page, pageSize })));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list tools';
      res.status(500).json(errorResponse(message));
    }
  }

  async getMyTools(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      const { tools, total } = await toolService.getToolsByUser(userId, { page, pageSize });
      res.json(successResponse(paginatedResponse(tools, total, { page, pageSize })));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get tools';
      res.status(500).json(errorResponse(message));
    }
  }

  async createTool(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const { name, description, category, condition, neighborhoodId } = req.body;

      if (!name || !description || !category || !condition || !neighborhoodId) {
        return res.status(400).json(errorResponse('Missing required fields'));
      }

      const tool = await toolService.createTool(userId, {
        name,
        description,
        category,
        condition,
        neighborhoodId,
      });

      res.status(201).json(successResponse(tool, 'Tool created successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create tool';
      res.status(500).json(errorResponse(message));
    }
  }

  async getToolById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const tool = await toolService.getToolById(id);
      if (!tool) {
        return res.status(404).json(errorResponse('Tool not found'));
      }

      // Get all images for the tool
      const images = await imageService.getImagesByToolId(id);

      res.json(successResponse({ ...tool, images }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get tool';
      res.status(500).json(errorResponse(message));
    }
  }

  async updateTool(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      const userRole = req.headers['x-user-role'] as string;
      const { id } = req.params;

      // Check ownership or admin
      const isOwner = await toolService.isOwner(id, userId);
      if (!isOwner && userRole !== 'ADMIN') {
        return res.status(403).json(errorResponse('Access denied'));
      }

      const tool = await toolService.updateTool(id, req.body);
      res.json(successResponse(tool, 'Tool updated successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update tool';
      res.status(500).json(errorResponse(message));
    }
  }

  async deleteTool(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      const userRole = req.headers['x-user-role'] as string;
      const { id } = req.params;

      // Check ownership or admin
      const isOwner = await toolService.isOwner(id, userId);
      if (!isOwner && userRole !== 'ADMIN') {
        return res.status(403).json(errorResponse('Access denied'));
      }

      await toolService.deleteTool(id);
      res.json(successResponse(null, 'Tool deleted successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete tool';
      res.status(500).json(errorResponse(message));
    }
  }

  async uploadImages(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { id } = req.params;

      // Check ownership
      const isOwner = await toolService.isOwner(id, userId);
      if (!isOwner) {
        return res.status(403).json(errorResponse('Access denied'));
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json(errorResponse('No images provided'));
      }

      const images = await imageService.uploadImages(id, files);
      res.status(201).json(successResponse(images, 'Images uploaded successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload images';
      res.status(500).json(errorResponse(message));
    }
  }

  async deleteImage(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { id, imageId } = req.params;

      // Check ownership
      const isOwner = await toolService.isOwner(id, userId);
      if (!isOwner) {
        return res.status(403).json(errorResponse('Access denied'));
      }

      // Verify image belongs to this tool
      const imageToolId = await imageService.getImageToolId(imageId);
      if (imageToolId !== id) {
        return res.status(404).json(errorResponse('Image not found'));
      }

      await imageService.deleteImage(imageId);
      res.json(successResponse(null, 'Image deleted successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete image';
      res.status(500).json(errorResponse(message));
    }
  }

  async setPrimaryImage(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { id, imageId } = req.params;

      // Check ownership
      const isOwner = await toolService.isOwner(id, userId);
      if (!isOwner) {
        return res.status(403).json(errorResponse('Access denied'));
      }

      await imageService.setPrimaryImage(id, imageId);
      res.json(successResponse(null, 'Primary image set successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to set primary image';
      res.status(500).json(errorResponse(message));
    }
  }

  async toggleAvailability(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      const { id } = req.params;
      const { isAvailable } = req.body;

      // Check ownership
      const isOwner = await toolService.isOwner(id, userId);
      if (!isOwner) {
        return res.status(403).json(errorResponse('Access denied'));
      }

      const tool = await toolService.toggleAvailability(id, isAvailable);
      res.json(successResponse(tool, `Tool marked as ${isAvailable ? 'available' : 'unavailable'}`));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update availability';
      res.status(500).json(errorResponse(message));
    }
  }

  async getToolsByNeighborhood(req: Request, res: Response, next: NextFunction) {
    try {
      const { neighborhoodId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      const { tools, total } = await toolService.getToolsByNeighborhood(neighborhoodId, { page, pageSize });
      res.json(successResponse(paginatedResponse(tools, total, { page, pageSize })));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get tools';
      res.status(500).json(errorResponse(message));
    }
  }

  async getToolsByUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      const { tools, total } = await toolService.getToolsByUser(userId, { page, pageSize });
      res.json(successResponse(paginatedResponse(tools, total, { page, pageSize })));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get tools';
      res.status(500).json(errorResponse(message));
    }
  }
}
