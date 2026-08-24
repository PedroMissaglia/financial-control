'use client';

import { useMemo } from 'react';

import { primeiroNome } from '@/data/conta-conjunta';
import type { Transacao } from '@/data/transacoes';
import { getApiUrl } from '@/lib/api-url';
import { useCategorias } from '@/lib/use-categorias';
import { useEscopoFinanceiro } from '@/lib/use-escopo-financeiro';
import { useAppSelector } from '@/store/hooks';

import type { DashboardMfBaseProps, DashboardNotaUsuario } from '../../shared/dashboard-contract';

/** Shared Redux + apiUrl props for dashboard view/editor microfrontends. */
export function useMfDashboardBaseProps(
  transacoes: Transacao[],
  options?: { loading?: boolean },
): DashboardMfBaseProps {
  const widgets = useAppSelector(state => state.dashboard.widgets);
  const layoutRows = useAppSelector(state => state.dashboard.layoutRows);
  const layoutGroups = useAppSelector(state => state.dashboard.layoutGroups);
  const extratoLimite = useAppSelector(state => state.dashboard.extratoLimite);
  const blocoNotas = useAppSelector(state => state.dashboard.blocoNotas);
  const usuario = useAppSelector(state => state.auth.usuario);
  const { usuarioIds, metaEconomiaEfetiva, alertaGastosEfetivo, donoLabels, visao, parceiro, parceiroMeta } =
    useEscopoFinanceiro();
  const { labels: categoriaLabels } = useCategorias(usuarioIds);
  const loading = Boolean(options?.loading);
  const labelsForBreakdown = visao === 'conjunto' ? donoLabels : undefined;

  const notasPorUsuario = useMemo((): DashboardNotaUsuario[] => {
    const selfId = usuario?.id;
    const selfHtml = blocoNotas ?? '';
    const parceiroHtml = parceiroMeta?.blocoNotas ?? '';
    const parceiroNome = primeiroNome(parceiro?.nome);

    if (!selfId) return [];

    if (visao === 'parceiro' && parceiro) {
      return [{ usuarioId: parceiro.id, nome: parceiroNome, html: parceiroHtml, editavel: false }];
    }

    if (visao === 'conjunto' && parceiro) {
      return [
        { usuarioId: selfId, nome: 'Você', html: selfHtml, editavel: true },
        { usuarioId: parceiro.id, nome: parceiroNome, html: parceiroHtml, editavel: false },
      ];
    }

    return [{ usuarioId: selfId, nome: 'Você', html: selfHtml, editavel: true }];
  }, [blocoNotas, parceiro, parceiroMeta?.blocoNotas, usuario?.id, visao]);

  return useMemo(
    () => ({
      transacoes: transacoes ?? [],
      widgets: widgets ?? [],
      layoutRows: layoutRows ?? [],
      layoutGroups: layoutGroups ?? [],
      metaEconomia: metaEconomiaEfetiva,
      alertaGastos: alertaGastosEfetivo,
      extratoLimite,
      blocoNotas: blocoNotas ?? '',
      notasPorUsuario,
      apiUrl: getApiUrl(),
      categoriaLabels,
      usuarioIds,
      donoLabels: labelsForBreakdown,
      loading,
    }),
    [
      transacoes,
      widgets,
      layoutRows,
      layoutGroups,
      metaEconomiaEfetiva,
      alertaGastosEfetivo,
      extratoLimite,
      blocoNotas,
      notasPorUsuario,
      categoriaLabels,
      usuarioIds,
      labelsForBreakdown,
      loading,
    ],
  );
}
