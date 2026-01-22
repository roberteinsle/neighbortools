import { Router } from 'express';
import { NeighborhoodController } from '../controllers/neighborhood.controller.js';

const router = Router();
const neighborhoodController = new NeighborhoodController();

// GET /neighborhoods - List neighborhoods for current user
router.get('/', neighborhoodController.listNeighborhoods);

// POST /neighborhoods - Create new neighborhood
router.post('/', neighborhoodController.createNeighborhood);

// GET /neighborhoods/:id - Get neighborhood details
router.get('/:id', neighborhoodController.getNeighborhoodById);

// PUT /neighborhoods/:id - Update neighborhood
router.put('/:id', neighborhoodController.updateNeighborhood);

// DELETE /neighborhoods/:id - Delete neighborhood (owner only)
router.delete('/:id', neighborhoodController.deleteNeighborhood);

// POST /neighborhoods/join - Join neighborhood with invite code
router.post('/join', neighborhoodController.joinNeighborhood);

// POST /neighborhoods/:id/leave - Leave neighborhood
router.post('/:id/leave', neighborhoodController.leaveNeighborhood);

// POST /neighborhoods/:id/regenerate-code - Regenerate invite code (admin/owner only)
router.post('/:id/regenerate-code', neighborhoodController.regenerateInviteCode);

// GET /neighborhoods/:id/members - List neighborhood members
router.get('/:id/members', neighborhoodController.getMembers);

export { router as neighborhoodRouter };
