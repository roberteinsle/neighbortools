import { Router } from 'express';
import { MemberController } from '../controllers/member.controller.js';

const router = Router();
const memberController = new MemberController();

// PUT /members/:memberId/role - Update member role (admin/owner only)
router.put('/:memberId/role', memberController.updateMemberRole);

// DELETE /members/:memberId - Remove member from neighborhood (admin/owner only)
router.delete('/:memberId', memberController.removeMember);

// POST /members/invite - Send email invite to join neighborhood
router.post('/invite', memberController.sendInvite);

// GET /members/invites/:neighborhoodId - List pending invites for neighborhood
router.get('/invites/:neighborhoodId', memberController.listInvites);

// DELETE /members/invites/:inviteId - Revoke invite
router.delete('/invites/:inviteId', memberController.revokeInvite);

export { router as memberRouter };
