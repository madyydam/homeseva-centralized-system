// Cryptographic Web-Crypto based Session Engine for Edge Middleware & Node Runtime
// Zero external dependencies; 100% secure HMAC-SHA256 signatures with expiry.

const SECRET_KEY_RAW =
  process.env.AUTH_SECRET ||
  process.env.SUPABASE_SECRET_KEY ||
  'homeseva_production_super_secret_master_key_2026_secured_v4';

const encoder = new TextEncoder();

async function getCryptoKey(): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    encoder.encode(SECRET_KEY_RAW),
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
  isSuperAdmin?: boolean;
  exp: number; // Unix timestamp in ms
}

/**
 * Signs a session payload and returns a tamper-proof JWT-like token: base64(payload).base64(signature)
 */
export async function signSession(
  payload: Omit<SessionPayload, 'exp'>,
  expiresInSeconds: number = 28800 // 8 hours default
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
