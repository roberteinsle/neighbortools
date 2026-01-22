import { PrismaClient } from '@prisma/client';
import type { NeighborhoodMember, MemberRole, PaginationParams } from '@neighbortools/shared-types';
import { calculateOffset } from '@neighbortools/shared-utils';

const prisma = new PrismaClient();

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

    // TODO: Send email notification via notification service
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
