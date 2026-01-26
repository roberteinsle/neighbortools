import { PrismaClient } from '@prisma/client';
import type { NeighborhoodMember, MemberRole, PaginationParams } from '@neighbortools/shared-types';
import { calculateOffset } from '@neighbortools/shared-utils';

const prisma = new PrismaClient();

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3005';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service:3001';
const APP_URL = process.env.APP_URL || 'http://localhost:5173';

interface InviteDto {
  neighborhoodId: string;
  email: string;
}

export class MemberService {
  async getMembers(
    neighborhoodId: string,
    params: PaginationParams
  ): Promise<{ members: NeighborhoodMember[]; total: number }> {
    const { skip, take } = calculateOffset(params);

    const [members, total] = await Promise.all([
      prisma.neighborhoodMember.findMany({
        where: { neighborhoodId },
        skip,
        take,
        orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
      }),
      prisma.neighborhoodMember.count({
        where: { neighborhoodId },
      }),
    ]);

    return {
      members: members.map(this.mapMemberToResponse),
      total,
    };
  }

  async getMemberById(memberId: string): Promise<NeighborhoodMember | null> {
    const member = await prisma.neighborhoodMember.findUnique({
      where: { id: memberId },
    });

    if (!member) return null;

    return this.mapMemberToResponse(member);
  }

  async updateMemberRole(memberId: string, newRole: MemberRole): Promise<NeighborhoodMember> {
    const member = await prisma.neighborhoodMember.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new Error('Member not found');
    }

    if (member.role === 'OWNER') {
      throw new Error('Cannot change role of neighborhood owner');
    }

    if (newRole === 'OWNER') {
      throw new Error('Cannot promote to owner. Use transfer ownership instead.');
    }

    const updated = await prisma.neighborhoodMember.update({
      where: { id: memberId },
      data: { role: newRole },
    });

    return this.mapMemberToResponse(updated);
  }

  async removeMember(memberId: string): Promise<void> {
    const member = await prisma.neighborhoodMember.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new Error('Member not found');
    }

    if (member.role === 'OWNER') {
      throw new Error('Cannot remove neighborhood owner');
    }

    await prisma.neighborhoodMember.delete({
      where: { id: memberId },
    });
  }

  async sendInvite(invitedBy: string, dto: InviteDto): Promise<void> {
    // Check if invite already exists
    const existingInvite = await prisma.neighborhoodInvite.findFirst({
      where: {
        neighborhoodId: dto.neighborhoodId,
        invitedEmail: dto.email.toLowerCase(),
        status: 'PENDING',
      },
    });

    if (existingInvite) {
      throw new Error('An invite has already been sent to this email');
    }

    // Get neighborhood details
    const neighborhood = await prisma.neighborhood.findUnique({
      where: { id: dto.neighborhoodId },
    });

    if (!neighborhood) {
      throw new Error('Neighborhood not found');
    }

    // Create invite with 7 day expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.neighborhoodInvite.create({
      data: {
        neighborhoodId: dto.neighborhoodId,
        invitedBy,
        invitedEmail: dto.email.toLowerCase(),
        expiresAt,
      },
    });

    // Send email notification via notification service
    try {
      // Get inviter's name from user service
      let inviterName = 'A neighbor';
      try {
        const userResponse = await fetch(`${USER_SERVICE_URL}/users/${invitedBy}`, {
          headers: {
            'x-user-id': invitedBy,
            'x-user-role': 'SYSTEM',
          },
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.success && userData.data) {
            inviterName = `${userData.data.firstName} ${userData.data.lastName}`.trim() || 'A neighbor';
          }
        }
      } catch (err) {
        console.error('Failed to fetch inviter info:', err);
      }

      // Send email via notification service
      await fetch(`${NOTIFICATION_SERVICE_URL}/notifications/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: dto.email.toLowerCase(),
          subject: `You're invited to join ${neighborhood.name} on NeighborTools`,
          templateKey: 'neighborhood-invite',
          data: {
            inviterName,
            neighborhoodName: neighborhood.name,
            description: neighborhood.description || '',
            inviteCode: neighborhood.inviteCode,
            appUrl: APP_URL,
          },
        }),
      });
    } catch (err) {
      // Log error but don't fail the invite creation
      console.error('Failed to send invite email:', err);
    }
  }

  async listInvites(neighborhoodId: string): Promise<any[]> {
    const invites = await prisma.neighborhoodInvite.findMany({
      where: {
        neighborhoodId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return invites;
  }

  async getInviteById(inviteId: string): Promise<any | null> {
    return prisma.neighborhoodInvite.findUnique({
      where: { id: inviteId },
    });
  }

  async revokeInvite(inviteId: string): Promise<void> {
    await prisma.neighborhoodInvite.update({
      where: { id: inviteId },
      data: { status: 'REVOKED' },
    });
  }

  async getMemberByUserAndNeighborhood(
    userId: string,
    neighborhoodId: string
  ): Promise<NeighborhoodMember | null> {
    const member = await prisma.neighborhoodMember.findUnique({
      where: {
        neighborhoodId_userId: {
          neighborhoodId,
          userId,
        },
      },
    });

    if (!member) return null;

    return this.mapMemberToResponse(member);
  }

  private mapMemberToResponse(member: any): NeighborhoodMember {
    return {
      id: member.id,
      userId: member.userId,
      neighborhoodId: member.neighborhoodId,
      role: member.role,
      joinedAt: member.joinedAt,
    };
  }
}
