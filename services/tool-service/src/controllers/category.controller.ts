import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service.js';
import { successResponse, errorResponse, paginatedResponse } from '@neighbortools/shared-utils';
import type { Language } from '@neighbortools/shared-types';

const categoryService = new CategoryService();

export class CategoryController {
  async listCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const language = (req.query.language as Language) || 'EN';
      const categories = await categoryService.listCategories(language);
      res.json(successResponse(categories));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list categories';
      res.status(500).json(errorResponse(message));
    }
  }

  async getTopLevelCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const language = (req.query.language as Language) || 'EN';
      const categories = await categoryService.getTopLevelCategories(language);
      res.json(successResponse(categories));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get top-level categories';
      res.status(500).json(errorResponse(message));
    }
  }

  async getCategoryById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const category = await categoryService.getCategoryById(id);

      if (!category) {
        return res.status(404).json(errorResponse('Category not found'));
      }

      res.json(successResponse(category));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get category';
      res.status(500).json(errorResponse(message));
    }
  }

  async getCategoryWithChildren(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const language = (req.query.language as Language) || 'EN';
      const category = await categoryService.getCategoryWithChildren(id, language);

      if (!category) {
        return res.status(404).json(errorResponse('Category not found'));
      }

      res.json(successResponse(category));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get category';
      res.status(500).json(errorResponse(message));
    }
  }

  async getToolsByCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const neighborhoodId = req.query.neighborhoodId as string;

      if (!neighborhoodId) {
        return res.status(400).json(errorResponse('Neighborhood ID is required'));
      }

      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;

      const { tools, total } = await categoryService.getToolsByCategory(
        id,
        neighborhoodId,
        { page, pageSize }
      );

      res.json(successResponse(paginatedResponse(tools, total, { page, pageSize })));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get tools';
      res.status(500).json(errorResponse(message));
    }
  }

  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const userRole = req.headers['x-user-role'] as string;

      if (userRole !== 'ADMIN') {
        return res.status(403).json(errorResponse('Admin access required'));
      }

      const { key, nameEn, nameDe, nameEs, nameFr, emoji, parentId, googleId, sortOrder } = req.body;

      if (!key || !nameEn) {
        return res.status(400).json(errorResponse('Key and English name are required'));
      }

      const category = await categoryService.createCategory({
        key,
        nameEn,
        nameDe,
        nameEs,
        nameFr,
        emoji,
        parentId,
        googleId,
        sortOrder,
      });

      res.status(201).json(successResponse(category, 'Category created successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create category';
      res.status(500).json(errorResponse(message));
    }
  }

  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const userRole = req.headers['x-user-role'] as string;

      if (userRole !== 'ADMIN') {
        return res.status(403).json(errorResponse('Admin access required'));
      }

      const { id } = req.params;
      const category = await categoryService.updateCategory(id, req.body);

      res.json(successResponse(category, 'Category updated successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update category';
      res.status(500).json(errorResponse(message));
    }
  }

  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const userRole = req.headers['x-user-role'] as string;

      if (userRole !== 'ADMIN') {
        return res.status(403).json(errorResponse('Admin access required'));
      }

      const { id } = req.params;
      await categoryService.deleteCategory(id);

      res.json(successResponse(null, 'Category deleted successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete category';
      res.status(400).json(errorResponse(message));
    }
  }

  async seedCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const userRole = req.headers['x-user-role'] as string;

      if (userRole !== 'ADMIN') {
        return res.status(403).json(errorResponse('Admin access required'));
      }

      const result = await categoryService.seedDefaultCategories();

      res.json(
        successResponse(
          result,
          `Seeding complete: ${result.created} created, ${result.skipped} skipped`
        )
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to seed categories';
      res.status(500).json(errorResponse(message));
    }
  }
}
