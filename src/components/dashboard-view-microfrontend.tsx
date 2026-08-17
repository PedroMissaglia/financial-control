'use client';

import { useMemo } from 'react';

import type { Transacao } from '@/data/transacoes';
import { getApiUrl } from '@/lib/api-url';
import { MF_DASHBOARD_URL } from '@/lib/load-mf-remote';
import { useMfDashboardMount } from '@/lib/use-mf-dashboard-mount';
import { useAppSelector } from '@/store/hooks';

import type { DashboardViewProps } from '../../shared/dashboard-contract';

interface DashboardViewMicrofrontendProps {
  transacoes: Transacao[];
}

export function DashboardViewMicrofrontend({ transacoes }: Readonly<DashboardViewMicrofrontendProps>) {
  const widgets = useAppSelector(state => state.dashboard.widgets);
  const layoutRows = useAppSelector(state => state.dashboard.layoutRows);
  const layoutGroups = useAppSelector(state => state.dashboard.layoutGroups);
  const metaEconomia = useAppSelector(state => state.dashboard.metaEconomia);
  const alertaGastos = useAppSelector(state => state.dashboard.alertaGastos);
  const extratoLimite = useAppSelector(state => state.dashboard.extratoLimite);

  const mfProps = useMemo<DashboardViewProps>(
    () => ({
      transacoes: transacoes ?? [],
      widgets: widgets ?? [],
      layoutRows: layoutRows ?? [],
      layoutGroups: layoutGroups ?? [],
      metaEconomia,
      alertaGastos,
      extratoLimite,
      apiUrl: getApiUrl(),
    }),
    [transacoes, widgets, layoutRows, layoutGroups, metaEconomia, alertaGastos, extratoLimite],
  );

  const { hostRef, mode } = useMfDashboardMount('./DashboardView', mfProps);

  return (
    <>
      {mode === 'loading' && (
        <p className="text-muted-foreground mb-4 text-sm" role="status">
          Carregando dashboard...
        </p>
      )}
      {mode === 'error' && (
        <p className="text-muted-foreground mb-4 text-sm" role="alert">
          O microfrontend do dashboard não respondeu em {MF_DASHBOARD_URL}. Verifique se o serviço mf-dashboard está
          em execução.
        </p>
      )}
      <div ref={hostRef} />
    </>
  );
}
