import { PrismaClient, LendingStatus } from '@prisma/client';
import type { Lending, CreateLendingDto, PaginationParams } from '@neighbortools/shared-types';
import { calculateOffset, isDateInPast } from '@neighbortools/shared-utils';

const prisma = new PrismaClient();

interface LendingFilters {
  borrowerId?: string;
  lenderId?: string;
  toolId?: string;
  neighborhoodId?: string;
  status?: LendingStatus;
}

interface CreateLendingInput extends CreateLendingDto {
  borrowerId: string;
  lenderId: string;
  toolName: string;
  neighborhoodId: string;
}

export class LendingService {
  async listLendings(
    userId: string,
    role: 'borrower' | 'lender' | 'all',
    filters: LendingFilters,
    params: PaginationParams
  ): Promise<{ lendings: Lending[]; total: number }> {
    const { skip, take } = calculateOffset(params);

    const where: any = { ...filters };

    if (role === 'borrower') {
      where.borrowerId = userId;
    } else if (role === 'lender') {
      where.lenderId = userId;
    } else {
      where.OR = [{ borrowerId: userId }, { lenderId: userId }];
    }

    const [lendings, total] = await Promise.all([
      prisma.lending.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.lending.count({ where }),
    ]);

    return {
      lendings: lendings.map(this.mapToResponse),
      total,
    };
  }

  async createLending(input: CreateLendingInput): Promise<Lending> {
    // Validate dates
    if (isDateInPast(new Date(input.startDate))) {
      throw new Error('Start date cannot be in the past');
    }

    if (new Date(input.endDate) <= new Date(input.startDate)) {
      throw new Error('End date must be after start date');
    }

    // Check for overlapping lendings
    const overlapping = await prisma.lending.findFirst({
      where: {
        toolId: input.toolId,
        status: { in: ['PENDING', 'APPROVED', 'ACTIVE'] },
        OR: [
          {
            startDate: { lte: input.endDate },
            endDate: { gte: input.startDate },
          },
        ],
      },
    });

    if (overlapping) {
      throw new Error('Tool is not available for the selected dates');
    }

    const lending = await prisma.lending.create({
      data: {
        toolId: input.toolId,
        toolName: input.toolName,
        borrowerId: input.borrowerId,
        lenderId: input.lenderId,
        neighborhoodId: input.neighborhoodId,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        message: input.message,
        history: {
          create: {
            status: 'PENDING',
            changedBy: input.borrowerId,
            note: 'Lending request created',
          },
        },
      },
    });

    // Create reminders
    await this.createReminders(lending.id, lending.startDate, lending.endDate);

    return this.mapToResponse(lending);
  }

  async getLendingById(id: string): Promise<Lending | null> {
    const lending = await prisma.lending.findUnique({
      where: { id },
    });

    if (!lending) return null;

    return this.mapToResponse(lending);
  }

  async approveLending(id: string, lenderId: string): Promise<Lending> {
    const lending = await prisma.lending.findUnique({ where: { id } });

    if (!lending) {
      throw new Error('Lending not found');
    }

    if (lending.lenderId !== lenderId) {
      throw new Error('Only the tool owner can approve this request');
    }

    if (lending.status !== 'PENDING') {
      throw new Error('Can only approve pending requests');
    }

    const updated = await prisma.lending.update({
      where: { id },
      data: {
        status: 'APPROVED',
        respondedAt: new Date(),
        history: {
          create: {
            status: 'APPROVED',
            changedBy: lenderId,
            note: 'Request approved',
          },
        },
      },
    });

    // TODO: Notify borrower via notification service

    return this.mapToResponse(updated);
  }

  async rejectLending(id: string, lenderId: string, reason?: string): Promise<Lending> {
    const lending = await prisma.lending.findUnique({ where: { id } });

    if (!lending) {
      throw new Error('Lending not found');
    }

    if (lending.lenderId !== lenderId) {
      throw new Error('Only the tool owner can reject this request');
    }

    if (lending.status !== 'PENDING') {
      throw new Error('Can only reject pending requests');
    }

    const updated = await prisma.lending.update({
      where: { id },
      data: {
        status: 'REJECTED',
        respondedAt: new Date(),
        history: {
          create: {
            status: 'REJECTED',
            changedBy: lenderId,
            note: reason || 'Request rejected',
          },
        },
      },
    });

    return this.mapToResponse(updated);
  }

  async cancelLending(id: string, borrowerId: string): Promise<Lending> {
    const lending = await prisma.lending.findUnique({ where: { id } });

    if (!lending) {
      throw new Error('Lending not found');
    }

    if (lending.borrowerId !== borrowerId) {
      throw new Error('Only the borrower can cancel this request');
    }

    if (!['PENDING', 'APPROVED'].includes(lending.status)) {
      throw new Error('Can only cancel pending or approved requests');
    }

    const updated = await prisma.lending.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        history: {
          create: {
            status: 'CANCELLED',
            changedBy: borrowerId,
            note: 'Request cancelled by borrower',
          },
        },
      },
    });

    return this.mapToResponse(updated);
  }

  async startLending(id: string, userId: string): Promise<Lending> {
    const lending = await prisma.lending.findUnique({ where: { id } });

    if (!lending) {
      throw new Error('Lending not found');
    }

    if (lending.lenderId !== userId && lending.borrowerId !== userId) {
      throw new Error('Only participants can start the lending');
    }

    if (lending.status !== 'APPROVED') {
      throw new Error('Can only start approved lendings');
    }

    const updated = await prisma.lending.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        actualStartDate: new Date(),
        history: {
          create: {
            status: 'ACTIVE',
            changedBy: userId,
            note: 'Tool picked up',
          },
        },
      },
    });

    return this.mapToResponse(updated);
  }

  async returnLending(id: string, userId: string, note?: string): Promise<Lending> {
    const lending = await prisma.lending.findUnique({ where: { id } });

    if (!lending) {
      throw new Error('Lending not found');
    }

    if (lending.lenderId !== userId) {
      throw new Error('Only the tool owner can confirm return');
    }

    if (!['ACTIVE', 'OVERDUE'].includes(lending.status)) {
      throw new Error('Can only return active or overdue lendings');
    }

    const updated = await prisma.lending.update({
      where: { id },
      data: {
        status: 'RETURNED',
        returnedAt: new Date(),
        actualEndDate: new Date(),
        history: {
          create: {
            status: 'RETURNED',
            changedBy: userId,
            note: note || 'Tool returned',
          },
        },
      },
    });

    return this.mapToResponse(updated);
  }

  async extendLending(id: string, borrowerId: string, newEndDate: Date): Promise<Lending> {
    const lending = await prisma.lending.findUnique({ where: { id } });

    if (!lending) {
      throw new Error('Lending not found');
    }

    if (lending.borrowerId !== borrowerId) {
      throw new Error('Only the borrower can request an extension');
    }

    if (!['APPROVED', 'ACTIVE'].includes(lending.status)) {
      throw new Error('Can only extend approved or active lendings');
    }

    if (newEndDate <= lending.endDate) {
      throw new Error('New end date must be after current end date');
    }

    // Check for conflicts
    const overlapping = await prisma.lending.findFirst({
      where: {
        id: { not: id },
        toolId: lending.toolId,
        status: { in: ['PENDING', 'APPROVED', 'ACTIVE'] },
        startDate: { lte: newEndDate },
        endDate: { gte: lending.endDate },
      },
    });

    if (overlapping) {
      throw new Error('Cannot extend: tool is reserved for another lending');
    }

    const updated = await prisma.lending.update({
      where: { id },
      data: {
        endDate: newEndDate,
        history: {
          create: {
            status: lending.status,
            changedBy: borrowerId,
            note: `Extended end date to ${newEndDate.toISOString().split('T')[0]}`,
          },
        },
      },
    });

    // Update reminders
    await this.updateReminders(id, newEndDate);

    return this.mapToResponse(updated);
  }

  async getLendingHistory(id: string): Promise<any[]> {
    const history = await prisma.lendingHistory.findMany({
      where: { lendingId: id },
      orderBy: { createdAt: 'desc' },
    });

    return history;
  }

  async getLendingsByTool(
    toolId: string,
    params: PaginationParams
  ): Promise<{ lendings: Lending[]; total: number }> {
    const { skip, take } = calculateOffset(params);

    const [lendings, total] = await Promise.all([
      prisma.lending.findMany({
        where: { toolId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.lending.count({ where: { toolId } }),
    ]);

    return {
      lendings: lendings.map(this.mapToResponse),
      total,
    };
  }

  async getLendingsByNeighborhood(
    neighborhoodId: string,
    params: PaginationParams
  ): Promise<{ lendings: Lending[]; total: number }> {
    const { skip, take } = calculateOffset(params);

    const [lendings, total] = await Promise.all([
      prisma.lending.findMany({
        where: { neighborhoodId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.lending.count({ where: { neighborhoodId } }),
    ]);

    return {
      lendings: lendings.map(this.mapToResponse),
      total,
    };
  }

  async getUserStats(userId: string): Promise<any> {
    const [borrowedCount, lentCount, activeAsBorrower, activeAsLender] = await Promise.all([
      prisma.lending.count({
        where: { borrowerId: userId, status: 'RETURNED' },
      }),
      prisma.lending.count({
        where: { lenderId: userId, status: 'RETURNED' },
      }),
      prisma.lending.count({
        where: { borrowerId: userId, status: 'ACTIVE' },
      }),
      prisma.lending.count({
        where: { lenderId: userId, status: 'ACTIVE' },
      }),
    ]);

    return {
      totalBorrowed: borrowedCount,
      totalLent: lentCount,
      activeBorrowings: activeAsBorrower,
      activeLendings: activeAsLender,
    };
  }

  async checkAndMarkOverdue(): Promise<number> {
    const result = await prisma.lending.updateMany({
      where: {
        status: 'ACTIVE',
        endDate: { lt: new Date() },
      },
      data: {
        status: 'OVERDUE',
      },
    });

    return result.count;
  }

  async canUserAccessLending(lendingId: string, userId: string): Promise<boolean> {
    const lending = await prisma.lending.findUnique({
      where: { id: lendingId },
      select: { borrowerId: true, lenderId: true },
    });

    if (!lending) return false;

    return lending.borrowerId === userId || lending.lenderId === userId;
  }

  private async createReminders(lendingId: string, startDate: Date, endDate: Date): Promise<void> {
    const reminders = [];

    // Pickup reminder (1 day before start)
    const pickupReminder = new Date(startDate);
    pickupReminder.setDate(pickupReminder.getDate() - 1);
    if (pickupReminder > new Date()) {
      reminders.push({
        lendingId,
        type: 'PICKUP_REMINDER' as const,
        sendAt: pickupReminder,
      });
    }

    // Return reminder (1 day before end)
    const returnReminder = new Date(endDate);
    returnReminder.setDate(returnReminder.getDate() - 1);
    reminders.push({
      lendingId,
      type: 'RETURN_REMINDER' as const,
      sendAt: returnReminder,
    });

    if (reminders.length > 0) {
      await prisma.lendingReminder.createMany({ data: reminders });
    }
  }

  private async updateReminders(lendingId: string, newEndDate: Date): Promise<void> {
    // Delete existing return reminders
    await prisma.lendingReminder.deleteMany({
      where: {
        lendingId,
        type: 'RETURN_REMINDER',
        sentAt: null,
      },
    });

    // Create new return reminder
    const returnReminder = new Date(newEndDate);
    returnReminder.setDate(returnReminder.getDate() - 1);

    await prisma.lendingReminder.create({
      data: {
        lendingId,
        type: 'RETURN_REMINDER',
        sendAt: returnReminder,
      },
    });
  }

  private mapToResponse(lending: any): Lending {
    return {
      id: lending.id,
      toolId: lending.toolId,
      borrowerId: lending.borrowerId,
      lenderId: lending.lenderId,
      status: lending.status,
      requestedAt: lending.requestedAt,
      startDate: lending.startDate,
      endDate: lending.endDate,
      returnedAt: lending.returnedAt,
      message: lending.message,
      createdAt: lending.createdAt,
      updatedAt: lending.updatedAt,
    };
  }
}
