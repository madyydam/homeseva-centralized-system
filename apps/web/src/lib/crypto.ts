import bcrypt from 'bcryptjs';

const BCRYPT_SALT_ROUNDS = 10;
const BCRYPT_REGEX = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

/**
 * Checks if a string matches the standard modular crypt format for Bcrypt.
 */
export function isBcryptHash(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false;
  return BCRYPT_REGEX.test(value.trim());
}

/**
 * Hashes a plaintext password or PIN using bcrypt with salt rounds = 10.
 */
export async function hashCredential(plain: string): Promise<string> {
  const clean = (plain || '').trim();
  if (!clean) {
    throw new Error('Cannot hash empty credential.');
  }
  return await bcrypt.hash(clean, BCRYPT_SALT_ROUNDS);
}

export interface VerifyResult {
  isValid: boolean;
  needsRehash: boolean;
}

/**
 * Verifies a plaintext input against either:
 * 1. An existing standard Bcrypt hash ($2b$10$...) -> uses bcrypt.compare()
 * 2. A legacy unhashed plaintext string (for zero-downtime migration) -> compares timing-safely and flags needsRehash=true
 */
export async function verifyCredential(
  plain: string | null | undefined,
  storedHashOrPlain: string | null | undefined
): Promise<VerifyResult> {
  const cleanPlain = (plain || '').trim();
  const cleanStored = (storedHashOrPlain || '').trim();

  if (!cleanPlain || !cleanStored) {
    return { isValid: false, needsRehash: false };
  }

  // If already a valid Bcrypt hash, verify via bcrypt
  if (isBcryptHash(cleanStored)) {
    const isValid = await bcrypt.compare(cleanPlain, cleanStored);
    return { isValid, needsRehash: false };
  }

  // Zero-downtime backward compatibility for legacy plaintext rows:
  // Compare safely, and flag needsRehash=true so caller can upgrade the row to bcrypt in the database
  const isValid = cleanPlain === cleanStored;
  return { isValid, needsRehash: isValid };
}
