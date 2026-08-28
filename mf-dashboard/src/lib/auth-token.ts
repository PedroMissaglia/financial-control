const AUTH_STORAGE_KEY = 'fincontrol:auth';
const REFRESH_MARGIN_MS = 30_000;

interface StoredAuthSession {
  accessToken?: string | null;
  refreshToken?: string | null;
  expiresAt?: number | null;
  usuario?: unknown;
}

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

let refreshInFlight: Promise<string | undefined> | null = null;

function readStoredSession(): StoredAuthSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuthSession;
  } catch {
    return null;
  }
}

function writeStoredSession(session: StoredAuthSession) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function isAccessTokenStale(marginMs = REFRESH_MARGIN_MS): boolean {
  const expiresAt = readStoredSession()?.expiresAt;
  if (!expiresAt) return false;
  return expiresAt - Date.now() <= marginMs;
}

function persistTokens(tokens: TokenResponse) {
  const session = readStoredSession();
  if (!session?.usuario) return;

  const expiresAt = Date.now() + tokens.expiresIn * 1000;
  writeStoredSession({
    ...session,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt,
  });

  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `fincontrol_at=${encodeURIComponent(tokens.accessToken)}; path=/; max-age=${Math.max(1, tokens.expiresIn)}; SameSite=Lax${secure}`;
}

async function refreshAccessToken(apiUrl: string): Promise<string | undefined> {
  if (typeof window === 'undefined') return undefined;
  if (refreshInFlight !== null) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = readStoredSession()?.refreshToken;
    if (!refreshToken) return undefined;

    const response = await fetch(`${apiUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });

    if (!response.ok) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return undefined;
    }

    const data = (await response.json()) as TokenResponse;
    persistTokens(data);
    return data.accessToken;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

export function getDashboardAccessToken(): string | undefined {
  return readStoredSession()?.accessToken ?? undefined;
}

export function authHeaders(): HeadersInit {
  const token = getDashboardAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function ensureDashboardAccessToken(apiUrl: string): Promise<string | undefined> {
  if (typeof window === 'undefined') return getDashboardAccessToken();
  const session = readStoredSession();
  if (!session?.refreshToken) return getDashboardAccessToken();
  if (!isAccessTokenStale()) return getDashboardAccessToken();
  return refreshAccessToken(apiUrl);
}

export async function authFetch(apiUrl: string, path: string, init: RequestInit = {}): Promise<Response> {
  await ensureDashboardAccessToken(apiUrl);

  async function request() {
    const headers = new Headers(init.headers);
    const token = getDashboardAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return fetch(`${apiUrl}${path}`, { ...init, headers, cache: init.cache ?? 'no-store' });
  }

  let response = await request();

  if (response.status === 401 && typeof window !== 'undefined') {
    const nextToken = await refreshAccessToken(apiUrl);
    if (nextToken) {
      response = await request();
    }
  }

  return response;
}
