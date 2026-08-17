import { useEffect, useState } from 'react';

import { type Transacao } from '@/data/transacoes';
import { authHeaders } from '@/lib/auth-token';
import { parseTransacoesItems } from '@/lib/transacoes-page';

const MF_TRANSACOES_CHANGED = 'fincontrol:transacoes-changed';
const DEFAULT_API_URL = 'http://localhost:3001';

function getApiUrl(): string {
  return import.meta.env.VITE_API_URL ?? DEFAULT_API_URL;
}

function getUsuarioIdFromCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = /(?:^|; )fincontrol_uid=([^;]*)/.exec(document.cookie);
  return match ? decodeURIComponent(match[1]) : undefined;
}

function transacoesSignature(items: Transacao[] | undefined) {
  return (items ?? [])
    .map(item => `${item.id}:${item.valor}:${item.tipo}:${item.data}`)
    .sort()
    .join('|');
}

async function fetchTransacoesDoUsuario(usuarioId: string): Promise<Transacao[] | null> {
  const response = await fetch(`${getApiUrl()}/transacoes?usuarioId=${encodeURIComponent(usuarioId)}`, {
    cache: 'no-store',
    headers: authHeaders(),
  });
  if (!response.ok) return null;
  const json: unknown = await response.json();
  return parseTransacoesItems(json);
}

const EMPTY_TRANSACOES: Transacao[] = [];

export function useDashboardTransacoes(initial: Transacao[] = []) {
  const safeInitial = Array.isArray(initial) ? initial : EMPTY_TRANSACOES;
  const [transacoes, setTransacoes] = useState<Transacao[]>(safeInitial);

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
    async function refresh() {
      const usuarioId = getUsuarioIdFromCookie();
      if (!usuarioId) return;

      try {
        const data = await fetchTransacoesDoUsuario(usuarioId);
        if (!data) return;
        const nextSignature = transacoesSignature(data);
        setTransacoes(prev => (transacoesSignature(prev) === nextSignature ? prev : data));
      } catch (error) {
        console.warn('[mf-dashboard] Falha ao atualizar transações.', error);
      }
    }

    void refresh();
    window.addEventListener(MF_TRANSACOES_CHANGED, refresh);
    return () => window.removeEventListener(MF_TRANSACOES_CHANGED, refresh);
  }, []);

  return transacoes;
}
