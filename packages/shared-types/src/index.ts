// User Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  language: Language;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'USER' | 'ADMIN';

export type Language = 'EN' | 'DE' | 'ES' | 'FR';

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  language?: Language;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'createdAt' | 'updatedAt'>;
  token: string;
}

// Tool Types
export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  condition: ToolCondition;
  ownerId: string;
  neighborhoodId: string;
  imageUrl?: string;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ToolCategory =
  | 'HAND_TOOLS'
  | 'POWER_TOOLS'
  | 'GARDEN'
  | 'AUTOMOTIVE'
  | 'CLEANING'
  | 'PAINTING'
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'OTHER';

export type ToolCondition = 'NEW' | 'GOOD' | 'FAIR' | 'POOR';

export interface CreateToolDto {
  name: string;
  description: string;
  category: ToolCategory;
  condition: ToolCondition;
  neighborhoodId: string;
}

// Lending Types
export interface Lending {
  id: string;
  toolId: string;
  borrowerId: string;
  lenderId: string;
  status: LendingStatus;
  requestedAt: Date;
  startDate?: Date;
  endDate?: Date;
  returnedAt?: Date;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type LendingStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'RETURNED'
  | 'CANCELLED';

export interface CreateLendingDto {
  toolId: string;
  startDate: Date;
  endDate: Date;
  message?: string;
}

// Neighborhood Types
export interface Neighborhood {
  id: string;
  name: string;
  description?: string;
  inviteCode: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NeighborhoodMember {
  id: string;
  userId: string;
  neighborhoodId: string;
  role: MemberRole;
  joinedAt: Date;
}

export type MemberRole = 'MEMBER' | 'ADMIN' | 'OWNER';

export interface CreateNeighborhoodDto {
  name: string;
  description?: string;
}

export interface JoinNeighborhoodDto {
  inviteCode: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export type NotificationType =
  | 'LENDING_REQUEST'
  | 'LENDING_APPROVED'
  | 'LENDING_REJECTED'
  | 'LENDING_REMINDER'
  | 'NEIGHBORHOOD_INVITE'
  | 'SYSTEM';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}
