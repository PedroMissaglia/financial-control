const DEFAULT_API_URL = 'http://localhost:3001';

function stripTrailingSlash(url: string) {
  return url.replace(/\/$/, '');
}

function isLocalhostUrl(url: string) {
  try {
    const { hostname } = new URL(url);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return /localhost|127\.0\.0\.1/.test(url);
  }
}

function isLocalPage() {
  if (typeof window === 'undefined') return true;
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

function normalizeCandidate(raw?: string) {
  const value = raw?.trim();
  if (!value) return { skipped: 'empty' as const };
  const url = stripTrailingSlash(value);
  if (isLocalhostUrl(url) && !isLocalPage()) return { skipped: 'localhost-on-prod' as const, url };
  return { url };
}

function readRuntimeApiUrl() {
  if (typeof window === 'undefined') return undefined;
  return window.__FINCONTROL_API_URL__;
}

export function resolveDashboardApiUrl(apiUrl?: string) {
  const namedCandidates = [
    { source: 'prop', value: apiUrl },
    { source: 'window.__FINCONTROL_API_URL__', value: readRuntimeApiUrl() },
    { source: 'import.meta.env.VITE_API_URL', value: import.meta.env.VITE_API_URL },
  ] as const;

  const inspected = namedCandidates.map(candidate => {
    const normalized = normalizeCandidate(candidate.value);
    return {
      source: candidate.source,
      raw: candidate.value ?? null,
      ...normalized,
    };
  });

  const chosen = inspected.find(item => 'url' in item && item.url && !('skipped' in item));
  return chosen && 'url' in chosen && chosen.url ? chosen.url : DEFAULT_API_URL;
}
