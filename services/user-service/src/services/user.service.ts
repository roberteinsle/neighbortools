import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import type { User, PaginationParams } from '@neighbortools/shared-types';
import { calculateOffset, validatePassword } from '@neighbortools/shared-utils';

const prisma = new PrismaClient();

interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  language?: 'EN' | 'DE' | 'ES' | 'FR';
  role?: 'USER' | 'ADMIN';
  isActive?: boolean;
}

interface UpdateUserSettingsDto {
  emailNotifications?: boolean;
  lendingReminders?: boolean;
  neighborhoodUpdates?: boolean;
}

interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export class UserService {
  async listUsers(params: PaginationParams): Promise<{ users: User[]; total: number }> {
    const { skip, take } = calculateOffset(params);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count(),
    ]);

    return {
      users: users.map(this.mapUserToResponse),
      total,
    };
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    return this.mapUserToResponse(user);
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<User> {
    const language = dto.language?.toUpperCase() as UpdateUserDto['language'];
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(dto.firstName && { firstName: dto.firstName }),
        ...(dto.lastName && { lastName: dto.lastName }),
        ...(language && { language }),
        ...(dto.role && { role: dto.role }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    return this.mapUserToResponse(user);
  }

  async deleteUser(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  async getUserSettings(userId: string) {
    const settings = await prisma.userSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      // Create default settings if not exists
      return prisma.userSettings.create({
        data: { userId },
      });
    }

    return settings;
  }

  async updateUserSettings(userId: string, dto: UpdateUserSettingsDto) {
    return prisma.userSettings.upsert({
      where: { userId },
      update: dto,
      create: {
        userId,
        ...dto,
      },
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }

    // Validate new password
    const passwordErrors = validatePassword(dto.newPassword, user.email);
    if (passwordErrors.length > 0) {
      const errorMessages: Record<string, string> = {
        tooShort: 'Password must be at least 12 characters',
        tooLong: 'Password must not exceed 64 characters',
        containsEmail: 'Password must not contain your email address',
        repetitive: 'Password must not consist of repeating patterns',
        tooCommon: 'This password is too common and easily guessable',
      };
      throw new Error(passwordErrors.map(e => errorMessages[e]).join('. '));
    }

    // Hash and update password
    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async setUserActive(id: string, isActive: boolean): Promise<User> {
    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
    });

    return this.mapUserToResponse(user);
  }

  private mapUserToResponse(user: any): User {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      language: user.language,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
