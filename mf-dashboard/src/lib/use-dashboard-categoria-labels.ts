import { useEffect, useState } from 'react';

import { resolveDashboardApiUrl } from '@/lib/api-url';
import { authFetch } from '@/lib/auth-token';

function getUsuarioIdFromCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = /(?:^|; )fincontrol_uid=([^;]*)/.exec(document.cookie);
  return match ? decodeURIComponent(match[1]) : undefined;
}

function labelsSignature(labels: Record<string, string> | undefined) {
  return Object.entries(labels ?? {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, nome]) => `${id}:${nome}`)
    .join('|');
}

export function useDashboardCategoriaLabels(
  initial: Record<string, string> | undefined,
  apiUrl?: string,
): Record<string, string> {
  const resolvedApiUrl = resolveDashboardApiUrl(apiUrl);
  const [labels, setLabels] = useState<Record<string, string>>(initial ?? {});

  useEffect(() => {
    if (!initial || Object.keys(initial).length === 0) return;
    setLabels(prev => (labelsSignature(prev) === labelsSignature(initial) ? prev : initial));
  }, [initial]);

  useEffect(() => {
    async function load() {
      const usuarioId = getUsuarioIdFromCookie();
      if (!usuarioId) return;

      try {
        const response = await authFetch(
          resolvedApiUrl,
          `/categorias?usuarioId=${encodeURIComponent(usuarioId)}`,
        );
        if (!response.ok) return;
        const json: unknown = await response.json();
        if (!Array.isArray(json)) return;
        const next = Object.fromEntries(
          json
            .filter((item): item is { id: string; nome: string } => {
              return !!item && typeof item === 'object' && 'id' in item && 'nome' in item;
            })
            .map(item => [String(item.id), String(item.nome)]),
        );
        setLabels(prev => (labelsSignature(prev) === labelsSignature(next) ? prev : next));
      } catch (error) {
        console.warn('[mf-dashboard] Falha ao carregar categorias.', error);
      }
    }

    void load();

    window.addEventListener('fincontrol:categorias-changed', load);
    return () => window.removeEventListener('fincontrol:categorias-changed', load);
  }, [resolvedApiUrl]);

  return labels;
}
