import { PrismaClient } from '@prisma/client';
import type { Neighborhood, CreateNeighborhoodDto, PaginationParams } from '@neighbortools/shared-types';
import { generateInviteCode, calculateOffset } from '@neighbortools/shared-utils';

const prisma = new PrismaClient();

interface UpdateNeighborhoodDto {
  name?: string;
  description?: string;
}

export class NeighborhoodService {
  async listNeighborhoodsForUser(
    userId: string,
    params: PaginationParams
  ): Promise<{ neighborhoods: Neighborhood[]; total: number }> {
    const { skip, take } = calculateOffset(params);

    // Get neighborhoods where user is a member
    const memberships = await prisma.neighborhoodMember.findMany({
      where: { userId },
      include: { neighborhood: true },
      skip,
      take,
      orderBy: { joinedAt: 'desc' },
    });

    const total = await prisma.neighborhoodMember.count({
      where: { userId },
    });

    const neighborhoods = memberships.map((m) => this.mapToResponse(m.neighborhood));

    return { neighborhoods, total };
  }

  async createNeighborhood(userId: string, dto: CreateNeighborhoodDto): Promise<Neighborhood> {
    const inviteCode = generateInviteCode(8);

    const neighborhood = await prisma.neighborhood.create({
      data: {
        name: dto.name,
        description: dto.description,
        inviteCode,
        createdBy: userId,
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
    });

    return this.mapToResponse(neighborhood);
  }

  async getNeighborhoodById(id: string): Promise<Neighborhood | null> {
    const neighborhood = await prisma.neighborhood.findUnique({
      where: { id },
    });

    if (!neighborhood) return null;

    return this.mapToResponse(neighborhood);
  }

  async updateNeighborhood(id: string, dto: UpdateNeighborhoodDto): Promise<Neighborhood> {
    const neighborhood = await prisma.neighborhood.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
      },
    });

    return this.mapToResponse(neighborhood);
  }

  async deleteNeighborhood(id: string): Promise<void> {
    await prisma.neighborhood.delete({
      where: { id },
    });
  }

  async joinByInviteCode(userId: string, inviteCode: string): Promise<Neighborhood> {
    const neighborhood = await prisma.neighborhood.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() },
    });

    if (!neighborhood) {
      throw new Error('Invalid invite code');
    }

    if (!neighborhood.isActive) {
      throw new Error('This neighborhood is no longer active');
    }

    // Check if already a member
    const existingMember = await prisma.neighborhoodMember.findUnique({
      where: {
        neighborhoodId_userId: {
          neighborhoodId: neighborhood.id,
          userId,
        },
      },
    });

    if (existingMember) {
      throw new Error('You are already a member of this neighborhood');
    }

    // Add user as member
    await prisma.neighborhoodMember.create({
      data: {
        neighborhoodId: neighborhood.id,
        userId,
        role: 'MEMBER',
      },
    });

    return this.mapToResponse(neighborhood);
  }

  async leaveNeighborhood(neighborhoodId: string, userId: string): Promise<void> {
    const member = await prisma.neighborhoodMember.findUnique({
      where: {
        neighborhoodId_userId: {
          neighborhoodId,
          userId,
        },
      },
    });

    if (!member) {
      throw new Error('You are not a member of this neighborhood');
    }

    if (member.role === 'OWNER') {
      // Check if there are other admins who can become owner
      const otherAdmins = await prisma.neighborhoodMember.findFirst({
        where: {
          neighborhoodId,
          userId: { not: userId },
          role: 'ADMIN',
        },
      });

      if (otherAdmins) {
        // Promote admin to owner
        await prisma.neighborhoodMember.update({
          where: { id: otherAdmins.id },
          data: { role: 'OWNER' },
        });
      } else {
        // Check if there are other members
        const otherMembers = await prisma.neighborhoodMember.findFirst({
          where: {
            neighborhoodId,
            userId: { not: userId },
          },
        });

        if (otherMembers) {
          // Promote a member to owner
          await prisma.neighborhoodMember.update({
            where: { id: otherMembers.id },
            data: { role: 'OWNER' },
          });
        } else {
          // Delete neighborhood if no other members
          await prisma.neighborhood.delete({
            where: { id: neighborhoodId },
          });
          return;
        }
      }
    }

    await prisma.neighborhoodMember.delete({
      where: {
        neighborhoodId_userId: {
          neighborhoodId,
          userId,
        },
      },
    });
  }

  async regenerateInviteCode(neighborhoodId: string): Promise<string> {
    const newCode = generateInviteCode(8);

    await prisma.neighborhood.update({
      where: { id: neighborhoodId },
      data: { inviteCode: newCode },
    });

    return newCode;
  }

  async getMemberRole(neighborhoodId: string, userId: string): Promise<string | null> {
    const member = await prisma.neighborhoodMember.findUnique({
      where: {
        neighborhoodId_userId: {
          neighborhoodId,
          userId,
        },
      },
    });

    return member?.role || null;
  }

  async isMember(neighborhoodId: string, userId: string): Promise<boolean> {
    const member = await prisma.neighborhoodMember.findUnique({
      where: {
        neighborhoodId_userId: {
          neighborhoodId,
          userId,
        },
      },
    });

    return !!member;
  }

  private mapToResponse(neighborhood: any): Neighborhood {
    return {
      id: neighborhood.id,
      name: neighborhood.name,
      description: neighborhood.description,
      inviteCode: neighborhood.inviteCode,
      createdBy: neighborhood.createdBy,
      createdAt: neighborhood.createdAt,
      updatedAt: neighborhood.updatedAt,
    };
  }
}
