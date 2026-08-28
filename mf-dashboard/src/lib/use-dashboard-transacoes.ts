import { useEffect, useRef, useState } from 'react';

import { type Transacao } from '@/data/transacoes';
import { resolveDashboardApiUrl } from '@/lib/api-url';
import { authFetch } from '@/lib/auth-token';
import { parseTransacoesItems } from '@/lib/transacoes-page';

const MF_TRANSACOES_CHANGED = 'fincontrol:transacoes-changed';
const MF_VISAO_CHANGED = 'fincontrol:visao-changed';

function getUsuarioIdFromCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = /(?:^|; )fincontrol_uid=([^;]*)/.exec(document.cookie);
  return match ? decodeURIComponent(match[1]) : undefined;
}

function buildQuery(usuarioIds: string[]): string {
  const search = new URLSearchParams();
  if (usuarioIds.length === 0) return '';
  search.set('usuarioId', usuarioIds[0]);
  if (usuarioIds.length > 1) search.set('usuarioIds', usuarioIds.join(','));
  return search.toString();
}

function transacoesSignature(items: Transacao[] | undefined) {
  return (items ?? [])
    .map(item => `${item.id}:${item.valor}:${item.tipo}:${item.data}`)
    .sort()
    .join('|');
}

async function fetchTransacoes(usuarioIds: string[], apiUrl: string): Promise<Transacao[] | null> {
  if (usuarioIds.length === 0) return [];
  const response = await authFetch(apiUrl, `/transacoes?${buildQuery(usuarioIds)}`);
  if (!response.ok) return null;
  const json: unknown = await response.json();
  return parseTransacoesItems(json);
}

const EMPTY_TRANSACOES: Transacao[] = [];

export function useDashboardTransacoes(
  initial: Transacao[] = [],
  apiUrl?: string,
  usuarioIdsProp?: string[],
) {
  const resolvedApiUrl = resolveDashboardApiUrl(apiUrl);
  const safeInitial = Array.isArray(initial) ? initial : EMPTY_TRANSACOES;
  const [transacoes, setTransacoes] = useState<Transacao[]>(safeInitial);
  const [loading, setLoading] = useState(false);
  const scopeRef = useRef<string[]>(usuarioIdsProp?.length ? usuarioIdsProp : []);
  const idsKey = (usuarioIdsProp ?? []).join(',');

  useEffect(() => {
    if (usuarioIdsProp?.length) scopeRef.current = usuarioIdsProp;
  }, [usuarioIdsProp]);

  useEffect(() => {
    const list = Array.isArray(initial) ? initial : EMPTY_TRANSACOES;
    setTransacoes(prev => (transacoesSignature(prev) === transacoesSignature(list) ? prev : list));
  }, [initial]);

  useEffect(() => {
    let cancelled = false;
    const genIds = idsKey ? idsKey.split(',') : scopeRef.current;

    async function refresh(options?: { fromVisao?: boolean; event?: Event }) {
      const detailIds = (options?.event as CustomEvent<{ usuarioIds?: string[] }> | undefined)?.detail
        ?.usuarioIds;
      if (detailIds?.length) scopeRef.current = detailIds;

      const ids =
        scopeRef.current.length > 0
          ? scopeRef.current
          : genIds.length > 0
            ? genIds
            : (() => {
                const cookieId = getUsuarioIdFromCookie();
                return cookieId ? [cookieId] : [];
              })();
      if (ids.length === 0) return;

      if (options?.fromVisao) {
        setLoading(true);
        setTransacoes([]);
      }

      try {
        const data = await fetchTransacoes(ids, resolvedApiUrl);
        if (cancelled || !data) return;
        setTransacoes(prev => (transacoesSignature(prev) === transacoesSignature(data) ? prev : data));
      } catch (error) {
        console.warn('[mf-dashboard] Falha ao atualizar transações.', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void refresh();

    function onChanged() {
      void refresh();
    }
    function onVisao(event: Event) {
      const detailIds = (event as CustomEvent<{ usuarioIds?: string[] }> | undefined)?.detail?.usuarioIds;
      const nextIds =
        detailIds?.length ? detailIds : genIds.length > 0 ? genIds : scopeRef.current;
      const nextKey = nextIds.join(',');
      const currentKey = scopeRef.current.join(',');
      if (nextKey === currentKey) return;
      void refresh({ fromVisao: true, event });
    }

    window.addEventListener(MF_TRANSACOES_CHANGED, onChanged);
    window.addEventListener(MF_VISAO_CHANGED, onVisao);
    return () => {
      cancelled = true;
      window.removeEventListener(MF_TRANSACOES_CHANGED, onChanged);
      window.removeEventListener(MF_VISAO_CHANGED, onVisao);
    };
  }, [resolvedApiUrl, idsKey]);

  return { transacoes, loading };
}
