// Cryptographic Web-Crypto based Session Engine for Edge Middleware & Node Runtime
// Zero external dependencies; 100% secure HMAC-SHA256 signatures with expiry.

function getSecretKeyRaw(): string {
  const secret = process.env.AUTH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('CRITICAL SECURITY ERROR: AUTH_SECRET environment variable is missing.');
    }
    // Safe development-only fallback
    return 'dev_insecure_auth_secret_key_minimum_32_characters_long_for_hmac';
  }
  return secret;
}

const encoder = new TextEncoder();

async function getCryptoKey(): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    encoder.encode(getSecretKeyRaw()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export interface SessionPayload {
  sub: string;
  role: string;
  businessSlug?: string;
  subcompanySlug?: string;
  isSuperAdmin?: boolean;
  username?: string;
  memberId?: string;
  memberName?: string;
  email?: string;
  exp: number; // Unix timestamp in ms
}

// 30 Days persistent session lifetime (prevents daily login frustration for staff)
export const ONE_MONTH_SESSION_SECONDS = 30 * 24 * 60 * 60; // 2,592,000 seconds
export const PERMANENT_SESSION_LIFETIME = ONE_MONTH_SESSION_SECONDS; // Standard 30-day session lifetime

/**
 * Signs a session payload and returns a tamper-proof JWT-like token: base64(payload).base64(signature)
 */
export async function signSession(
  payload: Omit<SessionPayload, 'exp'>,
  expiresInSeconds: number = PERMANENT_SESSION_LIFETIME
): Promise<string> {
  const key = await getCryptoKey();
  const fullPayload: SessionPayload = {
    ...payload,
    exp: Date.now() + expiresInSeconds * 1000,
  };

  const payloadJson = JSON.stringify(fullPayload);
  const payloadB64 = base64UrlEncode(encoder.encode(payloadJson));

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payloadB64)
  );
  const signatureB64 = base64UrlEncode(signatureBuffer);

  return `${payloadB64}.${signatureB64}`;
}

/**
 * Verifies the token signature and expiration. Returns payload if valid, null otherwise.
 */
export async function verifySession(token: string | null | undefined): Promise<SessionPayload | null> {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadB64, signatureB64] = parts;
  if (!payloadB64 || !signatureB64) return null;

  try {
    const key = await getCryptoKey();
    const signatureBytes = base64UrlDecode(signatureB64);

    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signatureBytes as unknown as BufferSource,
      encoder.encode(payloadB64)
    );

    if (!isValid) return null;

    const payloadBytes = base64UrlDecode(payloadB64);
    const payloadStr = new TextDecoder().decode(payloadBytes);
    const payload: SessionPayload = JSON.parse(payloadStr);

    if (Date.now() > payload.exp) {
      return null; // Expired
    }

    return payload;
  } catch (err) {
    return null;
  }
}

export const SUPER_ADMIN_COOKIE = 'homeseva_sa_token';
export const USER_SESSION_COOKIE = 'homeseva_user_session';

export async function getCurrentSuperAdminSession(): Promise<SessionPayload | null> {
  const { cookies } = await import('next/headers');
  const token = cookies().get(SUPER_ADMIN_COOKIE)?.value;
  const session = await verifySession(token);
  if (session && session.isSuperAdmin) {
    return session;
  }
  return null;
}

export async function getCurrentStaffSession(): Promise<SessionPayload | null> {
  const { cookies } = await import('next/headers');
  const token = cookies().get(USER_SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (session && !session.isSuperAdmin) {
    return session;
  }
  return null;
}
