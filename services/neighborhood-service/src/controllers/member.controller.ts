import { Request, Response, NextFunction } from 'express';
import { MemberService } from '../services/member.service.js';
import { NeighborhoodService } from '../services/neighborhood.service.js';
import { successResponse, errorResponse } from '@neighbortools/shared-utils';

const memberService = new MemberService();
const neighborhoodService = new NeighborhoodService();

export class MemberController {
  async updateMemberRole(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const { memberId } = req.params;
      const { role } = req.body;

      if (!role || !['MEMBER', 'ADMIN'].includes(role)) {
        return res.status(400).json(errorResponse('Valid role is required (MEMBER or ADMIN)'));
      }

      // Get the target member to find the neighborhood
      const targetMember = await memberService.getMemberById(memberId);
      if (!targetMember) {
        return res.status(404).json(errorResponse('Member not found'));
      }

      // Check if requester is admin or owner
      const requesterRole = await neighborhoodService.getMemberRole(
        targetMember.neighborhoodId,
        userId
      );
      if (!requesterRole || requesterRole === 'MEMBER') {
        return res.status(403).json(errorResponse('Admin or owner access required'));
      }

      // Admins can only manage members, not other admins
      if (requesterRole === 'ADMIN' && targetMember.role === 'ADMIN') {
        return res.status(403).json(errorResponse('Admins cannot manage other admins'));
      }

      const updated = await memberService.updateMemberRole(memberId, role);
      res.json(successResponse(updated, 'Member role updated successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update member role';
      res.status(400).json(errorResponse(message));
    }
  }

  async removeMember(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const { memberId } = req.params;

      // Get the target member to find the neighborhood
      const targetMember = await memberService.getMemberById(memberId);
      if (!targetMember) {
        return res.status(404).json(errorResponse('Member not found'));
      }

      // Check if requester is admin or owner
      const requesterRole = await neighborhoodService.getMemberRole(
        targetMember.neighborhoodId,
        userId
      );
      if (!requesterRole || requesterRole === 'MEMBER') {
        return res.status(403).json(errorResponse('Admin or owner access required'));
      }

      // Admins can only remove members, not other admins
      if (requesterRole === 'ADMIN' && targetMember.role === 'ADMIN') {
        return res.status(403).json(errorResponse('Admins cannot remove other admins'));
      }

      await memberService.removeMember(memberId);
      res.json(successResponse(null, 'Member removed successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove member';
      res.status(400).json(errorResponse(message));
    }
  }

  async sendInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const { neighborhoodId, email } = req.body;

      if (!neighborhoodId || !email) {
        return res.status(400).json(errorResponse('neighborhoodId and email are required'));
      }

      // Check if requester is admin or owner
      const requesterRole = await neighborhoodService.getMemberRole(neighborhoodId, userId);
      if (!requesterRole || requesterRole === 'MEMBER') {
        return res.status(403).json(errorResponse('Admin or owner access required'));
      }

      await memberService.sendInvite(userId, { neighborhoodId, email });
      res.json(successResponse(null, 'Invite sent successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send invite';
      res.status(400).json(errorResponse(message));
    }
  }

  async listInvites(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const { neighborhoodId } = req.params;

      // Check if requester is admin or owner
      const requesterRole = await neighborhoodService.getMemberRole(neighborhoodId, userId);
      if (!requesterRole || requesterRole === 'MEMBER') {
        return res.status(403).json(errorResponse('Admin or owner access required'));
      }

      const invites = await memberService.listInvites(neighborhoodId);
      res.json(successResponse(invites));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to list invites';
      res.status(500).json(errorResponse(message));
    }
  }

  async revokeInvite(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers['x-user-id'] as string;
      if (!userId) {
        return res.status(401).json(errorResponse('Unauthorized'));
      }

      const { inviteId } = req.params;

      // Get invite to find the neighborhood
      const invite = await memberService.getInviteById(inviteId);
      if (!invite) {
        return res.status(404).json(errorResponse('Invite not found'));
      }

      // Check if requester is admin or owner of the neighborhood
      const requesterRole = await neighborhoodService.getMemberRole(invite.neighborhoodId, userId);
      if (!requesterRole || requesterRole === 'MEMBER') {
        return res.status(403).json(errorResponse('Admin or owner access required'));
      }

      await memberService.revokeInvite(inviteId);
      res.json(successResponse(null, 'Invite revoked successfully'));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to revoke invite';
      res.status(500).json(errorResponse(message));
    }
  }
}
