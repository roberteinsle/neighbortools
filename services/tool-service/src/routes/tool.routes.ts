import { Router } from 'express';
import { ToolController } from '../controllers/tool.controller.js';
import { upload } from '../middleware/upload.middleware.js';

const router: Router = Router();
const toolController = new ToolController();

// GET /tools - List tools (with filters)
router.get('/', toolController.listTools);

// GET /tools/my - Get current user's tools (must be before /:id)
router.get('/my', toolController.getMyTools);

// POST /tools - Create new tool
router.post('/', toolController.createTool);

// GET /tools/:id - Get tool details
router.get('/:id', toolController.getToolById);

// PUT /tools/:id - Update tool
router.put('/:id', toolController.updateTool);

// DELETE /tools/:id - Delete tool
router.delete('/:id', toolController.deleteTool);

// POST /tools/:id/images - Upload images
router.post('/:id/images', upload.array('images', 5), toolController.uploadImages);

// DELETE /tools/:id/images/:imageId - Delete image
router.delete('/:id/images/:imageId', toolController.deleteImage);

// PUT /tools/:id/images/:imageId/primary - Set primary image
router.put('/:id/images/:imageId/primary', toolController.setPrimaryImage);

// PUT /tools/:id/availability - Toggle availability
router.put('/:id/availability', toolController.toggleAvailability);

// GET /tools/neighborhood/:neighborhoodId - Get tools by neighborhood
router.get('/neighborhood/:neighborhoodId', toolController.getToolsByNeighborhood);

// GET /tools/user/:userId - Get tools by user
router.get('/user/:userId', toolController.getToolsByUser);

export { router as toolRouter };
