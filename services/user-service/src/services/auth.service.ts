import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import type { CreateUserDto, LoginDto, AuthResponse, User } from '@neighbortools/shared-types';
import { isValidEmail, validatePassword } from '@neighbortools/shared-utils';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_DAYS = 7;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL?.toLowerCase();

export class AuthService {
  async register(dto: CreateUserDto): Promise<{ user: Omit<User, 'createdAt' | 'updatedAt'>; accessToken: string; refreshToken: string }> {
    // Validate email
    if (!isValidEmail(dto.email)) {
      throw new Error('Invalid email format');
    }

    // Validate password
    const passwordErrors = validatePassword(dto.password, dto.email);
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

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // Check if this email should be admin
    const isAdmin = ADMIN_EMAIL && dto.email.toLowerCase() === ADMIN_EMAIL;

    // Create user
    const user = await prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        language: dto.language || 'EN',
        role: isAdmin ? 'ADMIN' : 'USER',
        settings: {
          create: {},
        },
      },
    });

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      user: this.mapUserToResponse(user),
      accessToken,
      refreshToken,
    };
  }

  async login(dto: LoginDto): Promise<{ user: Omit<User, 'createdAt' | 'updatedAt'>; accessToken: string; refreshToken: string }> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isValidPass = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValidPass) {
      throw new Error('Invalid email or password');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      user: this.mapUserToResponse(user),
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: string): Promise<void> {
    // Delete all refresh tokens for user
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async refresh(oldRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Find valid refresh token
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: oldRefreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new Error('Invalid or expired refresh token');
    }

    // Delete old refresh token
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    // Generate new tokens
    const accessToken = this.generateAccessToken(storedToken.userId);
    const refreshToken = await this.createRefreshToken(storedToken.userId);

    return { accessToken, refreshToken };
  }

  async getUserById(userId: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return null;

    return this.mapUserToResponse(user) as User;
  }

  async verifyToken(token: string): Promise<{ userId: string } | null> {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as { userId: string };
      return payload;
    } catch {
      return null;
    }
  }

  private generateAccessToken(userId: string): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  private async createRefreshToken(userId: string): Promise<string> {
    const token = jwt.sign({ userId, type: 'refresh' }, JWT_SECRET);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

    await prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
      },
    });

    return token;
  }

  private mapUserToResponse(user: any): Omit<User, 'createdAt' | 'updatedAt'> {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      language: user.language,
      role: user.role,
      isActive: user.isActive,
    };
  }
}
