import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller.js';

const router: Router = Router();
const categoryController = new CategoryController();

// GET /categories - List all categories
router.get('/', categoryController.listCategories);

// GET /categories/:id - Get category by ID
router.get('/:id', categoryController.getCategoryById);

// POST /categories - Create category (admin only)
router.post('/', categoryController.createCategory);

// PUT /categories/:id - Update category (admin only)
router.put('/:id', categoryController.updateCategory);

// DELETE /categories/:id - Delete category (admin only)
router.delete('/:id', categoryController.deleteCategory);

export { router as categoryRouter };
