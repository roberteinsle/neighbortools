import { Router } from 'express';
import { LendingController } from '../controllers/lending.controller.js';

const router: Router = Router();
const lendingController = new LendingController();

// GET /lendings - List lendings for current user
router.get('/', lendingController.listLendings);

// POST /lendings - Create lending request
router.post('/', lendingController.createLending);

// GET /lendings/:id - Get lending details
router.get('/:id', lendingController.getLendingById);

// PUT /lendings/:id/approve - Approve lending request
router.put('/:id/approve', lendingController.approveLending);

// PUT /lendings/:id/reject - Reject lending request
router.put('/:id/reject', lendingController.rejectLending);

// PUT /lendings/:id/cancel - Cancel lending request (by borrower)
router.put('/:id/cancel', lendingController.cancelLending);

// PUT /lendings/:id/start - Mark lending as started (pickup confirmed)
router.put('/:id/start', lendingController.startLending);

// PUT /lendings/:id/return - Mark tool as returned
router.put('/:id/return', lendingController.returnLending);

// PUT /lendings/:id/extend - Request extension
router.put('/:id/extend', lendingController.extendLending);

// GET /lendings/:id/history - Get lending history
router.get('/:id/history', lendingController.getLendingHistory);

// GET /lendings/tool/:toolId - Get lendings for a specific tool
router.get('/tool/:toolId', lendingController.getLendingsByTool);

// GET /lendings/neighborhood/:neighborhoodId - Get lendings in neighborhood
router.get('/neighborhood/:neighborhoodId', lendingController.getLendingsByNeighborhood);

// GET /lendings/stats - Get lending statistics for current user
router.get('/user/stats', lendingController.getUserStats);

export { router as lendingRouter };
