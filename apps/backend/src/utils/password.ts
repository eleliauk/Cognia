import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('密码长度至少为8位');
  }

  if (!/[a-zA-Z]/.test(password)) {
    errors.push('密码必须包含字母');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('密码必须包含数字');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
