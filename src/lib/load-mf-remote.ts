import type { TransacoesFiltros } from '@/lib/transacao-filters';

export const MF_TRANSACOES_URL = process.env.NEXT_PUBLIC_MF_TRANSACOES_URL ?? 'http://127.0.0.1:4200';
export const MF_DASHBOARD_URL = process.env.NEXT_PUBLIC_MF_DASHBOARD_URL ?? 'http://127.0.0.1:4300';

function resolveMfBaseUrl(configuredUrl: string, proxyPath: string): string {
  if (typeof window === 'undefined') return configuredUrl;
  if (process.env.NODE_ENV !== 'development') return configuredUrl;
  return `${window.location.origin}${proxyPath}`;
}

export function getMfTransacoesUrl(): string {
  return resolveMfBaseUrl(MF_TRANSACOES_URL, '/mf-proxy/transacoes');
}

export function getMfDashboardUrl(): string {
  return resolveMfBaseUrl(MF_DASHBOARD_URL, '/mf-proxy/dashboard');
}

export interface TransacoesMfMountProps {
  apiUrl: string;
  usuarioId?: string;
  accessToken?: string;
  filtros: TransacoesFiltros;
  pageSize: number;
}

export type MfMountFn<TProps> = (
  element: HTMLElement,
  props: TProps,
) => (() => void) | Promise<() => void>;

export interface RemoteModule<TProps = unknown> {
  mount: MfMountFn<TProps>;
}

interface FederationShared {
  packageName: string;
  outFileName: string;
}

interface FederationExpose {
  key: string;
  outFileName: string;
}

interface FederationInfo {
  shared: FederationShared[];
  exposes: FederationExpose[];
  builtAt?: string;
}

interface ImportShim {
  (url: string): Promise<unknown>;
  addImportMap?: (map: { imports: Record<string, string> }) => void;
}

function getImportShim(): ImportShim | undefined {
  return (window as Window & { importShim?: ImportShim }).importShim;
}

let importMapApplied = false;
const remoteCache = new Map<string, Promise<RemoteModule<unknown> | null>>();

const MF_FETCH_RETRY_DELAY_MS = 500;

function getFetchRetries(): number {
  if (typeof window !== 'undefined' && /localhost|127\.0\.0\.1/.test(window.location.hostname)) {
    return 120;
  }
  return process.env.NODE_ENV === 'development' ? 60 : 3;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryableRemoteError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (error instanceof Error) {
    return (
      error.message.includes('remoteEntry.json HTTP') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError')
    );
  }
  return false;
}

function loadImportShimScript(): Promise<ImportShim> {
  const existing = getImportShim();
  if (existing) return Promise.resolve(existing);

  (window as Window & { esmsInitOptions?: { shimMode: boolean } }).esmsInitOptions = { shimMode: true };

  return new Promise((resolve, reject) => {
    const alreadyInjected = document.querySelector('script[data-esms="local"]');
    const script = alreadyInjected instanceof HTMLScriptElement ? alreadyInjected : document.createElement('script');

    const finish = () => {
      const shim = getImportShim();
      if (shim) resolve(shim);
      else reject(new Error('es-module-shims carregou, mas importShim não ficou disponível'));
    };

    if (alreadyInjected) {
      if (getImportShim()) {
        finish();
        return;
      }
      script.addEventListener('load', finish, { once: true });
      script.addEventListener('error', () => reject(new Error('Falha ao carregar /es-module-shims.js')), { once: true });
      return;
    }

    script.src = '/es-module-shims.js';
    script.async = true;
    script.dataset.esms = 'local';
    script.addEventListener('load', finish, { once: true });
    script.addEventListener('error', () => reject(new Error('Falha ao carregar /es-module-shims.js')), { once: true });
    document.head.appendChild(script);
  });
}

function isCssResponse(response: Response): boolean {
  const type = response.headers.get('content-type') ?? '';
  return response.ok && !type.includes('text/html');
}

async function resolveMfStylesheetHref(baseUrl: string): Promise<string> {
  const direct = new URL('styles.css', `${baseUrl}/`).href;
  try {
    const probe = await fetch(direct, { cache: 'no-store' });
    if (isCssResponse(probe)) return direct;
  } catch {
    /* tenta o index.html */
  }

  try {
    const indexRes = await fetch(new URL('index.html', `${baseUrl}/`).href, { cache: 'no-store' });
    if (!indexRes.ok) return direct;
    const html = await indexRes.text();
    const hrefs = [...html.matchAll(/<link\b[^>]*href=["']([^"']+\.css)["'][^>]*>/gi)].map(match => match[1]);
    const local = hrefs.find(href => !href.startsWith('http') && !href.includes('fonts.google'));
    if (local) return new URL(local, `${baseUrl}/`).href;
  } catch {
    /* fallback para styles.css */
  }

  return direct;
}

async function ensureMfStyles(baseUrl: string): Promise<void> {
  const existing = document.querySelector(`link[data-mf-styles="${baseUrl}"]`) as HTMLLinkElement | null;
  if (existing) {
    if (existing.sheet || existing.dataset.loaded === 'true') return;
    await new Promise<void>(resolve => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => resolve(), { once: true });
    });
    return;
  }

  const href = await resolveMfStylesheetHref(baseUrl);

  await new Promise<void>(resolve => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.mfStyles = baseUrl;
    link.addEventListener(
      'load',
      () => {
        link.dataset.loaded = 'true';
        resolve();
      },
      { once: true },
    );
    link.addEventListener('error', () => resolve(), { once: true });
    document.head.appendChild(link);
  });
}

async function loadRemoteInternal(baseUrl: string, exposeKey: string): Promise<RemoteModule<unknown> | null> {
  await ensureMfStyles(baseUrl);

  const response = await fetch(`${baseUrl}/remoteEntry.json`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`remoteEntry.json HTTP ${response.status}`);
  }

  const info = (await response.json()) as FederationInfo;
  const expose = info.exposes.find(item => item.key === exposeKey);
  if (!expose) {
    throw new Error(`O remote não expõe ${exposeKey}`);
  }

  const imports: Record<string, string> = {};
  for (const shared of info.shared) {
    imports[shared.packageName] = new URL(shared.outFileName, `${baseUrl}/`).href;
  }

  const importShim = await loadImportShimScript();
  if (!importMapApplied && Object.keys(imports).length > 0) {
    importShim.addImportMap?.({ imports });
    importMapApplied = true;
  }

  const moduleUrl = new URL(expose.outFileName, `${baseUrl}/`);
  if (info.builtAt) moduleUrl.searchParams.set('v', info.builtAt);
  const remote = (await importShim(moduleUrl.href)) as {
    mount?: MfMountFn<unknown>;
    default?: MfMountFn<unknown> | RemoteModule<unknown>;
  };

  const mount =
    typeof remote.mount === 'function'
      ? remote.mount
      : typeof remote.default === 'function'
        ? remote.default
        : null;

  if (!mount) return null;
  return { mount };
}

async function loadRemoteInternalWithRetry(
  baseUrl: string,
  exposeKey: string,
): Promise<RemoteModule<unknown> | null> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= getFetchRetries(); attempt += 1) {
    try {
      return await loadRemoteInternal(baseUrl, exposeKey);
    } catch (error) {
      lastError = error;
      if (attempt < getFetchRetries() && isRetryableRemoteError(error)) {
        await sleep(MF_FETCH_RETRY_DELAY_MS);
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}

export function loadRemote<TProps = unknown>(
  baseUrl: string,
  exposeKey: string,
): Promise<RemoteModule<TProps> | null> {
  const cacheKey = `${baseUrl}::${exposeKey}`;
  const cached = remoteCache.get(cacheKey);
  if (cached) return cached as Promise<RemoteModule<TProps> | null>;

  const promise = loadRemoteInternalWithRetry(baseUrl, exposeKey)
    .then(result => {
      if (process.env.NODE_ENV !== 'development') {
        remoteCache.set(cacheKey, Promise.resolve(result));
      } else {
        remoteCache.delete(cacheKey);
      }
      return result;
    })
    .catch(error => {
      remoteCache.delete(cacheKey);
      throw error;
    });

  remoteCache.set(cacheKey, promise as Promise<RemoteModule<unknown> | null>);
  return promise as Promise<RemoteModule<TProps> | null>;
}

export function loadMfExpose<TProps = unknown>(exposeKey: string): Promise<RemoteModule<TProps> | null> {
  return loadRemote(getMfTransacoesUrl(), exposeKey);
}

export function loadDashboardExpose<TProps = unknown>(exposeKey: string): Promise<RemoteModule<TProps> | null> {
  return loadRemote(getMfDashboardUrl(), exposeKey);
}
