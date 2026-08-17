function destinoSeguro(from: string): boolean {
  if (!from.startsWith('/')) return false;
  if (from.startsWith('//')) return false;
  if (from === '/login' || from.startsWith('/login/') || from.startsWith('/login?')) return false;
  if (from.includes('://') || from.includes('\\')) return false;
  return true;
}

export function destinoPosLogin(from?: string | null): string {
  const value = from?.trim() ?? '';
  return destinoSeguro(value) ? value : '/';
}

export function destinoPosLoginDaUrl(): string {
  if (typeof window === 'undefined') return '/';
  return destinoPosLogin(new URLSearchParams(window.location.search).get('from'));
}

export function irParaDestinoPosLogin(from?: string | null) {
  const href = from === undefined ? destinoPosLoginDaUrl() : destinoPosLogin(from);
  window.location.assign(href);
}
