import { useEffect, useRef, useState } from 'react';

import { competenciaAtual, type GastoMensal } from '@/data/gastos-mensais';
import { resolveDashboardApiUrl } from '@/lib/api-url';
import { authFetch } from '@/lib/auth-token';

const MF_TRANSACOES_CHANGED = 'fincontrol:transacoes-changed';
const MF_GASTOS_MENSAIS_CHANGED = 'fincontrol:gastos-mensais-changed';
const MF_VISAO_CHANGED = 'fincontrol:visao-changed';

function getUsuarioIdFromCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = /(?:^|; )fincontrol_uid=([^;]*)/.exec(document.cookie);
  return match ? decodeURIComponent(match[1]) : undefined;
}

function buildQuery(usuarioIds: string[], competencia: string): string {
  const search = new URLSearchParams({ competencia });
  if (usuarioIds.length === 0) return search.toString();
  search.set('usuarioId', usuarioIds[0]);
  if (usuarioIds.length > 1) search.set('usuarioIds', usuarioIds.join(','));
  return search.toString();
}

function parseGastos(json: unknown): GastoMensal[] {
  if (!Array.isArray(json)) return [];
  const result: GastoMensal[] = [];
  for (const raw of json) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Record<string, unknown>;
    const valor = Number(item.valor);
    const diaVencimento = Number(item.diaVencimento);
    if (typeof item.id !== 'string' || typeof item.titulo !== 'string') continue;
    if (!Number.isFinite(valor) || !Number.isFinite(diaVencimento)) continue;
    result.push({
      id: item.id,
      titulo: item.titulo,
      diaVencimento,
      valor,
      pago: Boolean(item.pago),
      ...(typeof item.usuarioId === 'string' ? { usuarioId: item.usuarioId } : {}),
    });
  }
  return result;
}

function gastosSignature(items: GastoMensal[]) {
  return items
    .map(item => `${item.id}:${item.pago}:${item.valor}:${item.diaVencimento}`)
    .sort((a, b) => a.localeCompare(b))
    .join('|');
}

async function fetchGastos(usuarioIds: string[], apiUrl: string, competencia: string): Promise<GastoMensal[] | null> {
  if (usuarioIds.length === 0) return [];
  const response = await authFetch(
    apiUrl,
    `/gastos-mensais?${buildQuery(usuarioIds, competencia)}`,
  );
  if (!response.ok) return null;
  return parseGastos(await response.json());
}

export function useDashboardGastosMensais(
  apiUrl?: string,
  usuarioIdsProp?: string[],
  competencia = competenciaAtual(),
) {
  const resolvedApiUrl = resolveDashboardApiUrl(apiUrl);
  const [gastos, setGastos] = useState<GastoMensal[]>([]);
  const [loading, setLoading] = useState(false);
  const scopeRef = useRef<string[]>(usuarioIdsProp?.length ? usuarioIdsProp : []);
  const competenciaRef = useRef(competencia);
  const idsKey = (usuarioIdsProp ?? []).join(',');

  useEffect(() => {
    if (usuarioIdsProp?.length) scopeRef.current = usuarioIdsProp;
  }, [usuarioIdsProp]);

  useEffect(() => {
    let cancelled = false;

    async function refresh(options?: { fromVisao?: boolean; event?: Event }) {
      const detailIds = (options?.event as CustomEvent<{ usuarioIds?: string[] }> | undefined)?.detail
        ?.usuarioIds;
      if (detailIds?.length) scopeRef.current = detailIds;

      const ids =
        scopeRef.current.length > 0
          ? scopeRef.current
          : idsKey
            ? idsKey.split(',')
            : (() => {
                const cookieId = getUsuarioIdFromCookie();
                return cookieId ? [cookieId] : [];
              })();
      if (ids.length === 0) return;

      const competenciaChanged = competenciaRef.current !== competencia;
      competenciaRef.current = competencia;

      if (options?.fromVisao) {
        setLoading(true);
        setGastos([]);
      } else if (competenciaChanged) {
        setLoading(true);
        setGastos([]);
      }

      try {
        const data = await fetchGastos(ids, resolvedApiUrl, competencia);
        if (cancelled || !data) return;
        setGastos(prev => (gastosSignature(prev) === gastosSignature(data) ? prev : data));
      } catch (error) {
        console.warn('[mf-dashboard] Falha ao atualizar gastos mensais.', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void refresh();
    function onChanged() {
      void refresh();
    }
    function onVisao(event: Event) {
      void refresh({ fromVisao: true, event });
    }

    window.addEventListener(MF_TRANSACOES_CHANGED, onChanged);
    window.addEventListener(MF_GASTOS_MENSAIS_CHANGED, onChanged);
    window.addEventListener(MF_VISAO_CHANGED, onVisao);
    return () => {
      cancelled = true;
      window.removeEventListener(MF_TRANSACOES_CHANGED, onChanged);
      window.removeEventListener(MF_GASTOS_MENSAIS_CHANGED, onChanged);
      window.removeEventListener(MF_VISAO_CHANGED, onVisao);
    };
  }, [resolvedApiUrl, idsKey, competencia]);

  return { gastos, loading };
}
