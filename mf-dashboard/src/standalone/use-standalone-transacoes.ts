import { useEffect, useState } from 'react';

import { seedTransacoes, type Transacao } from '@/data/transacoes';
import { authFetch } from '@/lib/auth-token';
import { parseTransacoesItems } from '@/lib/transacoes-page';

const DEFAULT_API_URL = 'http://localhost:3001';
const DEFAULT_USUARIO_ID = '1';

function getApiUrl(): string {
  return import.meta.env.VITE_API_URL ?? DEFAULT_API_URL;
}

export function useStandaloneTransacoes(usuarioId = DEFAULT_USUARIO_ID) {
  const [transacoes, setTransacoes] = useState<Transacao[]>(seedTransacoes);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await authFetch(
          getApiUrl(),
          `/transacoes?usuarioId=${encodeURIComponent(usuarioId)}`,
        );

        if (!response.ok) {
          throw new Error(`API HTTP ${response.status}`);
        }

        const json: unknown = await response.json();
        if (cancelled) return;
        setTransacoes(parseTransacoesItems(json));
      } catch (fetchError) {
        if (cancelled) return;
        console.warn('[mf-dashboard] API indisponível, usando seed local.', fetchError);
        setTransacoes(seedTransacoes.filter(item => item.usuarioId === usuarioId));
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [usuarioId]);

  return { transacoes };
}
