// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  language: 'EN' | 'DE' | 'ES' | 'FR';
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  language?: string;
}

// Tool types
export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  condition: ToolCondition;
  available: boolean;
  ownerId: string;
  owner?: User;
  neighborhoodId: string;
  images: ToolImage[];
  createdAt: string;
  updatedAt: string;
}

export interface ToolImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  isPrimary: boolean;
}

export type ToolCategory =
  | 'POWER_TOOLS'
  | 'HAND_TOOLS'
  | 'GARDEN'
  | 'AUTOMOTIVE'
  | 'CLEANING'
  | 'PAINTING'
  | 'PLUMBING'
  | 'ELECTRICAL'
  | 'OTHER';

export type ToolCondition = 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR';

export interface CreateToolData {
  name: string;
  description: string;
  category: ToolCategory;
  condition: ToolCondition;
  neighborhoodId: string;
}

// Lending types
export interface Lending {
  id: string;
  toolId: string;
  tool?: Tool;
  borrowerId: string;
  borrower?: User;
  lenderId: string;
  lender?: User;
  status: LendingStatus;
  startDate: string;
  endDate: string;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

export type LendingStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTIVE'
  | 'RETURNED'
  | 'CANCELLED'
  | 'OVERDUE';

export interface CreateLendingData {
  toolId: string;
  startDate: string;
  endDate: string;
  message?: string;
}

// Neighborhood types
export interface Neighborhood {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    members: number;
    tools: number;
  };
}

export interface NeighborhoodMember {
  id: string;
  userId: string;
  user?: User;
  neighborhoodId: string;
  role: MemberRole;
  joinedAt: string;
}

export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface CreateNeighborhoodData {
  name: string;
  description: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
}

// Admin types
export interface SmtpConfig {
  id?: string;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  fromEmail: string;
  fromName: string;
  source?: 'environment' | 'database';
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  error?: string;
  createdAt: string;
}

export interface NotificationStats {
  notifications: {
    total: number;
    unread: number;
  };
  emails: {
    sent: number;
    failed: number;
  };
  scheduled: {
    pending: number;
  };
}

export interface AdminUser extends User {
  isActive?: boolean;
}
