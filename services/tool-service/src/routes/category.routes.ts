import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller.js';

const router: Router = Router();
const categoryController = new CategoryController();

// GET /categories - List all categories (flat list)
router.get('/', categoryController.listCategories);

// GET /categories/top-level - Get top-level categories with children
router.get('/top-level', categoryController.getTopLevelCategories);

// POST /categories/seed - Seed default categories (admin only)
router.post('/seed', categoryController.seedCategories);

// GET /categories/:id - Get category by ID
router.get('/:id', categoryController.getCategoryById);

// GET /categories/:id/with-children - Get category with children
router.get('/:id/with-children', categoryController.getCategoryWithChildren);

// GET /categories/:id/tools - Get tools by category
router.get('/:id/tools', categoryController.getToolsByCategory);

// POST /categories - Create category (admin only)
router.post('/', categoryController.createCategory);

// PUT /categories/:id - Update category (admin only)
router.put('/:id', categoryController.updateCategory);

// DELETE /categories/:id - Delete category (admin only)
router.delete('/:id', categoryController.deleteCategory);

export { router as categoryRouter };
