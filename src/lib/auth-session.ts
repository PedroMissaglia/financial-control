import type { UsuarioPublico } from '@/data/usuarios';

export const AUTH_STORAGE_KEY = 'fincontrol:auth';
export const UID_COOKIE = 'fincontrol_uid';
export const ACCESS_COOKIE = 'fincontrol_at';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface StoredAuthSession {
  usuario: UsuarioPublico;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
}

function cookieSecureSuffix() {
  return typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${cookieSecureSuffix()}`;
}

function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${cookieSecureSuffix()}`;
}

export function setUidCookie(id: string) {
  setCookie(UID_COOKIE, id, 60 * 60 * 24 * 7);
}

export function clearUidCookie() {
  clearCookie(UID_COOKIE);
}

function setAccessCookie(token: string, maxAgeSeconds: number) {
  setCookie(ACCESS_COOKIE, token, Math.max(1, maxAgeSeconds));
}

function clearAccessCookie() {
  clearCookie(ACCESS_COOKIE);
}

function isUsuarioPublico(value: unknown): value is UsuarioPublico {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.id === 'string' && typeof record.email === 'string' && typeof record.nome === 'string';
}

export function readStoredSession(): StoredAuthSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const armazenado = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!armazenado) return null;
    const parsed = JSON.parse(armazenado) as StoredAuthSession | UsuarioPublico;

    if ('usuario' in parsed && isUsuarioPublico(parsed.usuario)) {
      return {
        usuario: parsed.usuario,
        accessToken: parsed.accessToken ?? null,
        refreshToken: parsed.refreshToken ?? null,
        expiresAt: parsed.expiresAt ?? null,
      };
    }

    if (isUsuarioPublico(parsed)) {
      return { usuario: parsed, accessToken: null, refreshToken: null, expiresAt: null };
    }

    return null;
  } catch {
    return null;
  }
}

function writeStoredSession(session: StoredAuthSession) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function readStoredUsuario(): UsuarioPublico | null {
  return readStoredSession()?.usuario ?? null;
}

export function persistUsuario(usuario: UsuarioPublico) {
  const current = readStoredSession();
  writeStoredSession({
    usuario,
    accessToken: current?.accessToken ?? null,
    refreshToken: current?.refreshToken ?? null,
    expiresAt: current?.expiresAt ?? null,
  });
  setUidCookie(usuario.id);
  if (current?.accessToken && current.expiresAt) {
    const remaining = Math.floor((current.expiresAt - Date.now()) / 1000);
    if (remaining > 0) setAccessCookie(current.accessToken, remaining);
  }
}

export function persistSession(usuario: UsuarioPublico, tokens: { accessToken: string; refreshToken: string; expiresIn: number }) {
  const expiresAt = Date.now() + tokens.expiresIn * 1000;
  writeStoredSession({
    usuario,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt,
  });
  setUidCookie(usuario.id);
  setAccessCookie(tokens.accessToken, tokens.expiresIn);
}

export function persistTokens(tokens: { accessToken: string; refreshToken: string; expiresIn: number }) {
  const usuario = readStoredUsuario();
  if (!usuario) return;
  persistSession(usuario, tokens);
}

export function clearPersistedUsuario() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
  clearUidCookie();
  clearAccessCookie();
}

export function getRefreshToken(): string | null {
  return readStoredSession()?.refreshToken ?? null;
}

export function getExpiresAt(): number | null {
  return readStoredSession()?.expiresAt ?? null;
}

export function isAccessTokenStale(marginMs = 30_000): boolean {
  const expiresAt = getExpiresAt();
  if (!expiresAt) return false;
  return expiresAt - Date.now() <= marginMs;
}

export async function getAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') {
    const { cookies } = await import('next/headers');
    const raw = (await cookies()).get(ACCESS_COOKIE)?.value;
    if (!raw) return null;
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }

  return readStoredSession()?.accessToken ?? null;
}
