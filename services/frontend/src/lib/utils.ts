import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, locale: string = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateShort(date: string | Date, locale: string = 'en'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export type PasswordError = 'tooShort' | 'tooLong' | 'containsEmail' | 'repetitive' | 'tooCommon';

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

const PASSWORD_ERROR_KEYS: Record<PasswordError, string> = {
  tooShort: 'errors.passwordTooShort',
  tooLong: 'errors.passwordTooLong',
  containsEmail: 'errors.passwordContainsEmail',
  repetitive: 'errors.passwordRepetitive',
  tooCommon: 'errors.passwordTooCommon',
};

export function validatePassword(password: string, email?: string): PasswordError[] {
  const errors: PasswordError[] = [];

  if (password.length < 12) {
    errors.push('tooShort');
  }

  if (password.length > 64) {
    errors.push('tooLong');
  }

  if (email) {
    const localPart = email.toLowerCase().split('@')[0];
    if (localPart.length >= 3 && password.toLowerCase().includes(localPart)) {
      errors.push('containsEmail');
    }
  }

  if (password.length >= 12) {
    if (/^(.)\1+$/.test(password)) {
      errors.push('repetitive');
    } else if (/^(.{1,4})\1+.?$/.test(password)) {
      errors.push('repetitive');
    } else if (/^(?:0123456789|1234567890|9876543210)+/.test(password) && /^\d+$/.test(password)) {
      errors.push('repetitive');
    }
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('tooCommon');
  }

  return errors;
}

export function getPasswordErrorKey(error: PasswordError): string {
  return PASSWORD_ERROR_KEYS[error];
}
