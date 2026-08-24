import { useEffect, useRef, useState } from 'react';

import { type Transacao } from '@/data/transacoes';
import { resolveDashboardApiUrl } from '@/lib/api-url';
import { authHeaders } from '@/lib/auth-token';
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
  const url = `${apiUrl}/transacoes?${buildQuery(usuarioIds)}`;
  const response = await fetch(url, {
    cache: 'no-store',
    headers: authHeaders(),
  });
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
  const scopeRef = useRef<string[]>(usuarioIdsProp?.length ? usuarioIdsProp : []);

  useEffect(() => {
    if (usuarioIdsProp?.length) scopeRef.current = usuarioIdsProp;
  }, [usuarioIdsProp]);

  useEffect(() => {
    const list = Array.isArray(initial) ? initial : EMPTY_TRANSACOES;
    if (list.length === 0) return;
    const incomingSignature = transacoesSignature(list);
    setTransacoes(prev => {
      const incomingIds = new Set(list.map(item => item.id));
      const prevHasNewer = prev.some(item => !incomingIds.has(item.id));
      if (prevHasNewer && prev.length >= list.length) return prev;
      return transacoesSignature(prev) === incomingSignature ? prev : list;
    });
  }, [initial]);

  useEffect(() => {
    async function refresh(event?: Event) {
      const detailIds = (event as CustomEvent<{ usuarioIds?: string[] }> | undefined)?.detail?.usuarioIds;
      if (detailIds?.length) scopeRef.current = detailIds;

      const ids =
        scopeRef.current.length > 0
          ? scopeRef.current
          : (() => {
              const cookieId = getUsuarioIdFromCookie();
              return cookieId ? [cookieId] : [];
            })();
      if (ids.length === 0) return;

      try {
        const data = await fetchTransacoes(ids, resolvedApiUrl);
        if (!data) return;
        const nextSignature = transacoesSignature(data);
        setTransacoes(prev => (transacoesSignature(prev) === nextSignature ? prev : data));
      } catch (error) {
        console.warn('[mf-dashboard] Falha ao atualizar transações.', error);
      }
    }

    void refresh();

    window.addEventListener(MF_TRANSACOES_CHANGED, refresh);
    window.addEventListener(MF_VISAO_CHANGED, refresh);
    return () => {
      window.removeEventListener(MF_TRANSACOES_CHANGED, refresh);
      window.removeEventListener(MF_VISAO_CHANGED, refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: avoid refetch loops on props identity
  }, [resolvedApiUrl]);

  return transacoes;
}
