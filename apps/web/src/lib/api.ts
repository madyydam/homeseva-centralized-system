// API Client for Next.js web application
function getApiUrl(endpoint: string): string {
  const cleanPath = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  // 1. Server-side runtime (Next.js server function / Server Action):
  // Uses Vercel internal service binding if present (API_URL)
  if (typeof window === 'undefined' && process.env.API_URL) {
    const base = process.env.API_URL.endsWith('/')
      ? process.env.API_URL
      : `${process.env.API_URL}/`;
    return new URL(`api/v1/${cleanPath}`, base).toString();
  }

  // 2. Client-side explicit override if configured
  if (process.env.NEXT_PUBLIC_API_URL) {
    const base = process.env.NEXT_PUBLIC_API_URL.endsWith('/')
      ? process.env.NEXT_PUBLIC_API_URL
      : `${process.env.NEXT_PUBLIC_API_URL}/`;
    return new URL(cleanPath, base).toString();
  }

  // 3. Client-side default: same-domain relative path handled by Vercel rewrites
  return `/api/v1/${cleanPath}`;
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = getApiUrl(endpoint);
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // for HttpOnly auth cookies (AUTH-4)
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message || `API error: ${response.statusText}`);
  }

  return response.json();
}

