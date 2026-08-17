const AUTH_STORAGE_KEY = 'fincontrol:auth';

export function getDashboardAccessToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;

  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { accessToken?: string | null };
    return parsed.accessToken ?? undefined;
  } catch {
    return undefined;
  }
}

export function authHeaders(): HeadersInit {
  const token = getDashboardAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
