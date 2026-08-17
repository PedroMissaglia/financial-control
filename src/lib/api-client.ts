import {
  clearPersistedUsuario,
  getAccessToken,
  getRefreshToken,
  persistTokens,
} from '@/lib/auth-session';
import { getApiUrl } from '@/lib/api-url';

interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

let refreshInFlight: Promise<string | null> | null = null;

function isPublicAuthPath(path: string) {
  return path.startsWith('/auth/login') || path.startsWith('/auth/refresh') || path === '/usuarios';
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join(', ');
    if (typeof body.message === 'string' && body.message) return body.message;
  } catch {
    /* ignore */
  }
  return response.statusText || 'Erro na requisição';
}

async function refreshAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (refreshInFlight !== null) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    const response = await fetch(`${getApiUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
      cache: 'no-store',
    });

    if (!response.ok) {
      clearPersistedUsuario();
      return null;
    }

    const data = (await response.json()) as TokenResponse;
    persistTokens({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
    });
    return data.accessToken;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

export async function refreshSession(): Promise<boolean> {
  const token = await refreshAccessToken();
  return Boolean(token);
}

export async function logoutRemote(): Promise<void> {
  const refreshToken = getRefreshToken();
  const accessToken = await getAccessToken();

  try {
    await fetch(`${getApiUrl()}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(refreshToken ? { refreshToken } : {}),
      cache: 'no-store',
    });
  } catch {
    /* logout local even if the API is unreachable */
  }
}

export async function apiFetch(path: string, init: RequestInit & { auth?: boolean } = {}): Promise<Response> {
  const { auth = !isPublicAuthPath(path), headers, ...rest } = init;
  const url = `${getApiUrl()}${path}`;

  async function request(accessToken: string | null) {
    const nextHeaders = new Headers(headers);
    if (auth && accessToken) {
      nextHeaders.set('Authorization', `Bearer ${accessToken}`);
    }
    return fetch(url, { ...rest, headers: nextHeaders, cache: rest.cache ?? 'no-store' });
  }

  let accessToken = auth ? await getAccessToken() : null;
  let response = await request(accessToken);

  if (response.status === 401 && auth && typeof window !== 'undefined') {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      response = await request(nextToken);
    }
  }

  return response;
}

export async function readApiError(response: Response): Promise<string> {
  return parseErrorMessage(response);
}
