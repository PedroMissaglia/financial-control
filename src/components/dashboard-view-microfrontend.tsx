'use client';

import { useMemo } from 'react';

import { ApiUnavailableBanner } from '@/components/api-unavailable-banner';
import type { Transacao } from '@/data/transacoes';
import { MF_DASHBOARD_URL } from '@/lib/load-mf-remote';
import { useLiveTransacoes } from '@/lib/use-live-transacoes';
import { useMfDashboardMount } from '@/lib/use-mf-dashboard-mount';
import { useAppSelector } from '@/store/hooks';

import type { DashboardViewProps } from '../../shared/dashboard-contract';

interface DashboardViewMicrofrontendProps {
  transacoes: Transacao[];
}

export function DashboardViewMicrofrontend({ transacoes }: Readonly<DashboardViewMicrofrontendProps>) {
  const live = useLiveTransacoes(transacoes);

  const widgets = useAppSelector(state => state.dashboard.widgets);
  const layoutRows = useAppSelector(state => state.dashboard.layoutRows);
  const layoutGroups = useAppSelector(state => state.dashboard.layoutGroups);
  const metaEconomia = useAppSelector(state => state.dashboard.metaEconomia);
  const alertaGastos = useAppSelector(state => state.dashboard.alertaGastos);
  const extratoLimite = useAppSelector(state => state.dashboard.extratoLimite);

  const mfProps = useMemo<DashboardViewProps>(
    () => ({
      transacoes: live.transacoes ?? [],
      widgets: widgets ?? [],
      layoutRows: layoutRows ?? [],
      layoutGroups: layoutGroups ?? [],
      metaEconomia,
      alertaGastos,
      extratoLimite,
    }),
    [live.transacoes, widgets, layoutRows, layoutGroups, metaEconomia, alertaGastos, extratoLimite],
  );

  const { hostRef, mode } = useMfDashboardMount('./DashboardView', mfProps);

  return (
    <>
      {live.error ? <ApiUnavailableBanner onRetry={() => void live.retry()} /> : null}
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
