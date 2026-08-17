const DEFAULT_API_URL = 'http://127.0.0.1:3001';
const API_URL_LOG = '[fincontrol:api-url]';

let lastHostApiUrlLog: string | undefined;

function stripTrailingSlash(url: string) {
  return url.replace(/\/$/, '');
}

function readRuntimeApiUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const value = window.__FINCONTROL_API_URL__?.trim();
  return value ? stripTrailingSlash(value) : undefined;
}

function logHostApiUrl(source: string, result: string) {
  if (typeof window === 'undefined') return;
  const key = `${source}:${result}`;
  if (lastHostApiUrlLog === key) return;
  lastHostApiUrlLog = key;
  console.info(API_URL_LOG, 'host getApiUrl', {
    source,
    result,
    window: window.__FINCONTROL_API_URL__ ?? null,
    nextPublic: process.env.NEXT_PUBLIC_API_URL ?? null,
    page: window.location.origin,
  });
}

export function getApiUrl() {
  if (typeof window === 'undefined') {
    return stripTrailingSlash(process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL);
  }

  const fromRuntime = readRuntimeApiUrl();
  if (fromRuntime) {
    logHostApiUrl('window.__FINCONTROL_API_URL__', fromRuntime);
    return fromRuntime;
  }

  const fromNextPublic = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (fromNextPublic) {
    const result = stripTrailingSlash(fromNextPublic);
    logHostApiUrl('NEXT_PUBLIC_API_URL', result);
    return result;
  }

  logHostApiUrl('default', DEFAULT_API_URL);
  return DEFAULT_API_URL;
}

declare global {
  interface Window {
    __FINCONTROL_API_URL__?: string;
  }
}
