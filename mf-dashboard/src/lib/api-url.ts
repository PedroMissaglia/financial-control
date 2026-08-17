const DEFAULT_API_URL = 'http://localhost:3001';

export function resolveDashboardApiUrl(apiUrl?: string) {
  const fromProp = apiUrl?.trim();
  if (fromProp) return fromProp.replace(/\/$/, '');
  return import.meta.env.VITE_API_URL || DEFAULT_API_URL;
}
