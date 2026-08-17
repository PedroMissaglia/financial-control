const DEFAULT_API_URL = 'http://127.0.0.1:3001';

function stripTrailingSlash(url: string) {
  return url.replace(/\/$/, '');
}

function readRuntimeApiUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const value = window.__FINCONTROL_API_URL__?.trim();
  return value ? stripTrailingSlash(value) : undefined;
}

export function getServerApiUrl() {
  return stripTrailingSlash(process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL);
}

export function getBrowserApiUrl() {
  const fromNextPublic = process.env.NEXT_PUBLIC_API_URL?.trim();
  return fromNextPublic ? stripTrailingSlash(fromNextPublic) : DEFAULT_API_URL;
}

export function getApiUrl() {
  if (typeof window === 'undefined') {
    return getServerApiUrl();
  }

  const fromRuntime = readRuntimeApiUrl();
  if (fromRuntime) {
    return fromRuntime;
  }

  return getBrowserApiUrl();
}

declare global {
  interface Window {
    __FINCONTROL_API_URL__?: string;
  }
}
