'use client';

import { useMemo } from 'react';

import type { Transacao } from '@/data/transacoes';
import { getApiUrl } from '@/lib/api-url';
import { useCategorias } from '@/lib/use-categorias';
import { useEscopoFinanceiro } from '@/lib/use-escopo-financeiro';
import { useAppSelector } from '@/store/hooks';

import type { DashboardMfBaseProps } from '../../shared/dashboard-contract';

/** Shared Redux + apiUrl props for dashboard view/editor microfrontends. */
export function useMfDashboardBaseProps(
  transacoes: Transacao[],
  options?: { loading?: boolean },
): DashboardMfBaseProps {
  const widgets = useAppSelector(state => state.dashboard.widgets);
  const layoutRows = useAppSelector(state => state.dashboard.layoutRows);
  const layoutGroups = useAppSelector(state => state.dashboard.layoutGroups);
  const extratoLimite = useAppSelector(state => state.dashboard.extratoLimite);
  const { usuarioIds, metaEconomiaEfetiva, alertaGastosEfetivo, donoLabels, visao } = useEscopoFinanceiro();
  const { labels: categoriaLabels } = useCategorias(usuarioIds);
  const loading = Boolean(options?.loading);
  const labelsForBreakdown = visao === 'conjunto' ? donoLabels : undefined;

  return useMemo(
    () => ({
      transacoes: transacoes ?? [],
      widgets: widgets ?? [],
      layoutRows: layoutRows ?? [],
      layoutGroups: layoutGroups ?? [],
      metaEconomia: metaEconomiaEfetiva,
      alertaGastos: alertaGastosEfetivo,
      extratoLimite,
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
      categoriaLabels,
      usuarioIds,
      labelsForBreakdown,
      loading,
    ],
  );
}
