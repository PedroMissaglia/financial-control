import { useEffect, useState } from 'react';

import { competenciaAtual, type GastoMensal } from '@/data/gastos-mensais';
import { resolveDashboardApiUrl } from '@/lib/api-url';
import { authHeaders } from '@/lib/auth-token';

const MF_TRANSACOES_CHANGED = 'fincontrol:transacoes-changed';
const MF_GASTOS_MENSAIS_CHANGED = 'fincontrol:gastos-mensais-changed';

function getUsuarioIdFromCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = /(?:^|; )fincontrol_uid=([^;]*)/.exec(document.cookie);
  return match ? decodeURIComponent(match[1]) : undefined;
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

async function fetchGastosDoUsuario(usuarioId: string, apiUrl: string, competencia: string): Promise<GastoMensal[] | null> {
  const search = new URLSearchParams({ usuarioId, competencia });
  const response = await fetch(`${apiUrl}/gastos-mensais?${search.toString()}`, {
    cache: 'no-store',
    headers: authHeaders(),
  });
  if (!response.ok) return null;
  return parseGastos(await response.json());
}

export function useDashboardGastosMensais(apiUrl?: string) {
  const resolvedApiUrl = resolveDashboardApiUrl(apiUrl);
  const [gastos, setGastos] = useState<GastoMensal[]>([]);

  useEffect(() => {
    async function refresh() {
      const usuarioId = getUsuarioIdFromCookie();
      if (!usuarioId) return;

      try {
        const data = await fetchGastosDoUsuario(usuarioId, resolvedApiUrl, competenciaAtual());
        if (!data) return;
        const nextSignature = gastosSignature(data);
        setGastos(prev => (gastosSignature(prev) === nextSignature ? prev : data));
      } catch (error) {
        console.warn('[mf-dashboard] Falha ao atualizar gastos mensais.', error);
      }
    }

    void refresh();
    window.addEventListener(MF_TRANSACOES_CHANGED, refresh);
    window.addEventListener(MF_GASTOS_MENSAIS_CHANGED, refresh);
    return () => {
      window.removeEventListener(MF_TRANSACOES_CHANGED, refresh);
      window.removeEventListener(MF_GASTOS_MENSAIS_CHANGED, refresh);
    };
  }, [resolvedApiUrl]);

  return gastos;
}
