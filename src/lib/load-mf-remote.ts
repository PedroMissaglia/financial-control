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

const remoteCache = new Map<string, Promise<RemoteModule<unknown> | null>>();
let hostReactImportMapApplied = false;

/** Host React singleton shim paths (see public/mf-shared + MfReactBridge). */
const HOST_REACT_IMPORT_PATHS: Record<string, string> = {
  react: '/mf-shared/react.js',
  'react-dom': '/mf-shared/react-dom.js',
  'react-dom/client': '/mf-shared/react-dom-client.js',
  'react/jsx-runtime': '/mf-shared/jsx-runtime.js',
  'react/jsx-dev-runtime': '/mf-shared/jsx-dev-runtime.js',
};

/** Absolute URLs so es-module-shims does not reject relative vs absolute overrides. */
function getHostReactImports(): Record<string, string> {
  const origin = window.location.origin;
  const imports: Record<string, string> = {};
  for (const [name, path] of Object.entries(HOST_REACT_IMPORT_PATHS)) {
    imports[name] = new URL(path, origin).href;
  }
  return imports;
}

interface LoadRemoteOptions {
  /** Wait for MfReactBridge and register host React import map (mf-dashboard only). */
  requireReactBridge?: boolean;
}

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

async function ensureReactBridge(timeoutMs = 8000): Promise<void> {
  if (typeof window === 'undefined') return;
  const win = window as Window & {
    __FINCONTROL_REACT__?: unknown;
    __FINCONTROL_REACT_BRIDGE_READY__?: boolean;
  };
  if (win.__FINCONTROL_REACT_BRIDGE_READY__ && win.__FINCONTROL_REACT__) return;

  const started = Date.now();
  await new Promise<void>((resolve, reject) => {
    const tick = () => {
      if (win.__FINCONTROL_REACT_BRIDGE_READY__ && win.__FINCONTROL_REACT__) {
        resolve();
        return;
      }
      if (Date.now() - started > timeoutMs) {
        reject(new Error('React bridge not ready for mf-dashboard'));
        return;
      }
      window.setTimeout(tick, 16);
    };
    tick();
  });
}

async function loadRemoteInternal(
  baseUrl: string,
  exposeKey: string,
  options: LoadRemoteOptions = {},
): Promise<RemoteModule<unknown> | null> {
  const { requireReactBridge = false } = options;
  if (requireReactBridge) {
    await ensureReactBridge();
  }

  // Styles + remoteEntry in parallel (previously serial and blocked mount).
  const [, response] = await Promise.all([
    ensureMfStyles(baseUrl),
    fetch(`${baseUrl}/remoteEntry.json`, { cache: 'no-store' }),
  ]);
  if (!response.ok) {
    throw new Error(`remoteEntry.json HTTP ${response.status}`);
  }

  const info = (await response.json()) as FederationInfo;
  const expose = info.exposes.find(item => item.key === exposeKey);
  if (!expose) {
    throw new Error(`O remote não expõe ${exposeKey}`);
  }

  const imports: Record<string, string> = {};
  if (requireReactBridge && !hostReactImportMapApplied) {
    Object.assign(imports, getHostReactImports());
  }
  for (const shared of info.shared ?? []) {
    if (shared.packageName in HOST_REACT_IMPORT_PATHS) continue;
    imports[shared.packageName] = new URL(shared.outFileName, `${baseUrl}/`).href;
  }

  const importShim = await loadImportShimScript();
  if (Object.keys(imports).length > 0) {
    importShim.addImportMap?.({ imports });
  }
  if (requireReactBridge) {
    hostReactImportMapApplied = true;
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
  options: LoadRemoteOptions = {},
): Promise<RemoteModule<unknown> | null> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= getFetchRetries(); attempt += 1) {
    try {
      return await loadRemoteInternal(baseUrl, exposeKey, options);
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
  options: LoadRemoteOptions = {},
): Promise<RemoteModule<TProps> | null> {
  const cacheKey = `${baseUrl}::${exposeKey}`;
  const cached = remoteCache.get(cacheKey);
  if (cached) return cached as Promise<RemoteModule<TProps> | null>;

  const promise = loadRemoteInternalWithRetry(baseUrl, exposeKey, options)
    .then(result => {
      // Keep in-memory cache for the session (dev + prod) so revisiting Home
      // does not redo styles/entry/importShim work.
      remoteCache.set(cacheKey, Promise.resolve(result));
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
  return loadRemote(getMfDashboardUrl(), exposeKey, { requireReactBridge: true });
}

/** Warm the in-memory remote cache without mounting (Home / authenticated shell). */
export function prefetchDashboardExpose(exposeKey = './DashboardView'): void {
  if (typeof window === 'undefined') return;
  void loadDashboardExpose(exposeKey).catch(() => {
    /* prefetch is best-effort */
  });
}
