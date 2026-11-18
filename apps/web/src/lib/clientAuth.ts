/**
 * Client-Side Authentication & Session Persistence Helper for HomeSeva ERP
 * Manages persistent sub-company sessions, smart redirection, and clean logout.
 */

export interface ActiveSubcompanySession {
  slug: string;
  role?: string | undefined;
  branch?: string | undefined;
  division?: string | undefined;
  subcompany?: string | undefined;
  targetUrl: string;
  savedAt: number;
}

const STORAGE_KEY_LAST_SUBCOMPANY = 'homeseva_last_active_subcompany';
const STORAGE_KEY_CURRENT_USER = 'homeseva_current_user';

/**
 * Saves the last visited sub-company dashboard so when reopening the app or browser,
 * the user is automatically redirected straight back to this dashboard.
 */
export function saveActiveSubcompany(session: {
  slug: string;
  role?: string | undefined;
  branch?: string | undefined;
  division?: string | undefined;
  subcompany?: string | undefined;
  targetUrl?: string | undefined;
}) {
  if (typeof window === 'undefined') return;
  try {
    let target = `/app/${session.slug}/dashboard`;
    const params = new URLSearchParams();
    if (session.role) params.set('role', session.role);
    if (session.branch) params.set('branch', session.branch);
    if (session.division) params.set('division', session.division);
    if (session.subcompany) params.set('subcompany', session.subcompany);
    const qs = params.toString();
    if (qs) target += `?${qs}`;

    const payload: ActiveSubcompanySession = {
      slug: session.slug,
      role: session.role,
      branch: session.branch,
      division: session.division,
      subcompany: session.subcompany,
      targetUrl: target,
      savedAt: Date.now(),
    };

    localStorage.setItem(STORAGE_KEY_LAST_SUBCOMPANY, JSON.stringify(payload));
  } catch (err) {
    console.warn('Failed to save active subcompany:', err);
  }
}

/**
 * Retrieves the last active sub-company dashboard information.
 */
export function getLastActiveSubcompany(): ActiveSubcompanySession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LAST_SUBCOMPANY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Performs a complete, secure logout:
 * 1. Calls /api/auth/logout to destroy HTTP-only session cookies
 * 2. Clears all client localStorage credentials and saved sub-companies
 * 3. Redirects to the sub-company signin page or root portal
 */
export async function logoutUser(businessSlug?: string) {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (err) {
    console.warn('Logout API error:', err);
  }

  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      localStorage.removeItem(STORAGE_KEY_LAST_SUBCOMPANY);
      if (businessSlug) {
        localStorage.removeItem(`homeseva_session_${businessSlug}`);
      }
      // Also clear any other business session keys
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('homeseva_session_')) {
          localStorage.removeItem(key);
        }
      }
    } catch {}

    const target = businessSlug ? `/signin/${businessSlug}` : '/';
    window.location.href = target;
  }
}
