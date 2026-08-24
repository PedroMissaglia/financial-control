'use client';

import { useMemo } from 'react';

import type { Transacao } from '@/data/transacoes';
import { getApiUrl } from '@/lib/api-url';
import { useCategorias } from '@/lib/use-categorias';
import { useAppSelector } from '@/store/hooks';

import type { DashboardMfBaseProps } from '../../shared/dashboard-contract';

/** Shared Redux + apiUrl props for dashboard view/editor microfrontends. */
export function useMfDashboardBaseProps(transacoes: Transacao[]): DashboardMfBaseProps {
  const widgets = useAppSelector(state => state.dashboard.widgets);
  const layoutRows = useAppSelector(state => state.dashboard.layoutRows);
  const layoutGroups = useAppSelector(state => state.dashboard.layoutGroups);
  const metaEconomia = useAppSelector(state => state.dashboard.metaEconomia);
  const alertaGastos = useAppSelector(state => state.dashboard.alertaGastos);
  const extratoLimite = useAppSelector(state => state.dashboard.extratoLimite);
  const usuarioId = useAppSelector(state => state.auth.usuario?.id);
  const { labels: categoriaLabels } = useCategorias(usuarioId);

  return useMemo(
    () => ({
      transacoes: transacoes ?? [],
      widgets: widgets ?? [],
      layoutRows: layoutRows ?? [],
      layoutGroups: layoutGroups ?? [],
      metaEconomia,
      alertaGastos,
      extratoLimite,
      apiUrl: getApiUrl(),
      categoriaLabels,
    }),
    [
      transacoes,
      widgets,
      layoutRows,
      layoutGroups,
      metaEconomia,
      alertaGastos,
      extratoLimite,
      categoriaLabels,
    ],
  );
}
