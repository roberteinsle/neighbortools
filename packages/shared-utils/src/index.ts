import type { ApiResponse, PaginatedResponse, PaginationParams } from '@neighbortools/shared-types';

/**
 * Generate a random invite code for neighborhoods
 */
export function generateInviteCode(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create a success API response
 */
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

/**
 * Create an error API response
 */
export function errorResponse(error: string): ApiResponse<never> {
  return {
    success: false,
    error,
  };
}

/**
 * Create a paginated response
 */
export function paginatedResponse<T>(
  items: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const page = params.page || 1;
  const pageSize = params.pageSize || 10;
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Calculate pagination offset
 */
export function calculateOffset(params: PaginationParams): { skip: number; take: number } {
  const page = params.page || 1;
  const pageSize = params.pageSize || 10;
  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Common passwords list (top breached passwords)
 */
const COMMON_PASSWORDS = new Set([
  'password123456', '123456789012', 'qwertyuiop12', 'password1234',
  'iloveyou1234', 'admin1234567', 'letmein12345', 'welcome12345',
  'monkey1234567', 'master1234567', 'dragon1234567', 'login12345678',
  'princess12345', 'football12345', 'shadow12345678', 'sunshine12345',
  'trustno1trust', 'passw0rd12345', 'whatever12345', 'qwerty123456',
  'password12345', '123456789abc', 'abcdefghijkl', 'passwordpassword',
  '111111111111', '000000000000', '123123123123', 'abcabc123123',
  'qwertyqwerty', 'aaaaaaaaaaaa', 'password1111', '1234567890ab',
]);

/**
 * Validate password and return list of error codes
 */
export type PasswordError = 'tooShort' | 'tooLong' | 'containsEmail' | 'repetitive' | 'tooCommon';

export function validatePassword(password: string, email?: string): PasswordError[] {
  const errors: PasswordError[] = [];

  // Min 12 characters
  if (password.length < 12) {
    errors.push('tooShort');
  }

  // Max 64 characters
  if (password.length > 64) {
    errors.push('tooLong');
  }

  // No email/username in password
  if (email) {
    const emailLower = email.toLowerCase();
    const passwordLower = password.toLowerCase();
    const localPart = emailLower.split('@')[0];
    if (localPart.length >= 3 && passwordLower.includes(localPart)) {
      errors.push('containsEmail');
    }
  }

  // No pure repetitions (e.g. "aaaaaaaaaaaa", "123456789012", "abcabcabcabc")
  if (password.length >= 12) {
    // Check single char repetition
    if (/^(.)\1+$/.test(password)) {
      errors.push('repetitive');
    }
    // Check short pattern repetition (2-4 chars repeated)
    else if (/^(.{1,4})\1+.?$/.test(password)) {
      errors.push('repetitive');
    }
    // Check sequential numbers
    else if (/^(?:0123456789|1234567890|9876543210)+/.test(password) && /^\d+$/.test(password)) {
      errors.push('repetitive');
    }
  }

  // Check against common passwords
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('tooCommon');
  }

  return errors;
}

/**
 * Validate password strength (uses new rules)
 */
export function isValidPassword(password: string, email?: string): boolean {
  return validatePassword(password, email).length === 0;
}

/**
 * Sanitize string for safe output
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format date for display
 */
export function formatDate(date: Date, locale: string = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Check if a date is in the past
 */
export function isDateInPast(date: Date): boolean {
  return date.getTime() < Date.now();
}

/**
 * Check if a date is in the future
 */
export function isDateInFuture(date: Date): boolean {
  return date.getTime() > Date.now();
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
