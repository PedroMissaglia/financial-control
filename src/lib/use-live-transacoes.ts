'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { fetchTransacoes } from '@/app/services/transacoes';
import type { Transacao } from '@/data/transacoes';
import { getUsuarioIdFromCookie, MF_TRANSACOES_CHANGED } from '@/lib/mf-events';

function transacoesSignature(items: Transacao[] | undefined) {
  return (items ?? [])
    .map(item => `${item.id}:${item.valor}:${item.tipo}:${item.data}`)
    .sort()
    .join('|');
}

export function useLiveTransacoes(transacoes: Transacao[] = []) {
  const safe = Array.isArray(transacoes) ? transacoes : [];
  const [live, setLive] = useState(safe);
  const [error, setError] = useState<string | null>(null);
  const liveSignature = useRef(transacoesSignature(transacoes));

  useEffect(() => {
    const list = Array.isArray(transacoes) ? transacoes : [];
    const serverSignature = transacoesSignature(list);
    setLive(prev => {
      if (list.length === 0 && prev.length > 0) return prev;
      const incomingIds = new Set(list.map(item => item.id));
      const prevHasNewer = prev.some(item => !incomingIds.has(item.id));
      if (prevHasNewer && prev.length >= list.length) return prev;
      liveSignature.current = serverSignature;
      return transacoesSignature(prev) === serverSignature ? prev : list;
    });
  }, [transacoes]);

  const reload = useCallback(async () => {
    const usuarioId = getUsuarioIdFromCookie();
    if (!usuarioId) return;

    const result = await fetchTransacoes(usuarioId);
    if (!result.success || !result.data) {
      setError(result.message ?? 'Não foi possível conectar à API');
      return;
    }

    setError(null);
    const nextSignature = transacoesSignature(result.data);
    liveSignature.current = nextSignature;
    setLive(prev => (transacoesSignature(prev) === nextSignature ? prev : result.data ?? prev));
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    function onChanged() {
      void reload();
    }

    window.addEventListener(MF_TRANSACOES_CHANGED, onChanged);
    return () => window.removeEventListener(MF_TRANSACOES_CHANGED, onChanged);
  }, [reload]);

  return { transacoes: live, error, retry: reload };
}
