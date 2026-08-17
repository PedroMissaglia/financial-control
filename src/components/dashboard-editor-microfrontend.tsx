'use client';

import { useEffect, useMemo } from 'react';

import type { Transacao } from '@/data/transacoes';
import { getApiUrl } from '@/lib/api-url';
import { MF_DASHBOARD_URL } from '@/lib/load-mf-remote';
import { useMfDashboardMount } from '@/lib/use-mf-dashboard-mount';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setDashboardLayout, setWidgetCols, toggleWidget } from '@/store/slices/dashboard-slice';

import type {
  DashboardEditorProps,
  DashboardLayoutChangedDetail,
  DashboardWidgetColsDetail,
  DashboardWidgetToggleDetail,
} from '../../shared/dashboard-contract';
import {
  MF_DASHBOARD_LAYOUT_CHANGED,
  MF_DASHBOARD_WIDGET_COLS,
  MF_DASHBOARD_WIDGET_TOGGLE,
} from '../../shared/dashboard-contract';

interface DashboardEditorMicrofrontendProps {
  transacoes: Transacao[];
}

export function DashboardEditorMicrofrontend({ transacoes }: Readonly<DashboardEditorMicrofrontendProps>) {
  const dispatch = useAppDispatch();

  const widgets = useAppSelector(state => state.dashboard.widgets);
  const layoutRows = useAppSelector(state => state.dashboard.layoutRows);
  const layoutGroups = useAppSelector(state => state.dashboard.layoutGroups);
  const metaEconomia = useAppSelector(state => state.dashboard.metaEconomia);
  const alertaGastos = useAppSelector(state => state.dashboard.alertaGastos);
  const extratoLimite = useAppSelector(state => state.dashboard.extratoLimite);

  const mfProps = useMemo<DashboardEditorProps>(
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

  const { hostRef, mode } = useMfDashboardMount('./DashboardEditor', mfProps);

  useEffect(() => {
    const onLayoutChanged = (event: Event) => {
      const detail = (event as CustomEvent<DashboardLayoutChangedDetail>).detail;
      if (!detail) return;
      dispatch(setDashboardLayout(detail));
    };

    const onToggle = (event: Event) => {
      const detail = (event as CustomEvent<DashboardWidgetToggleDetail>).detail;
      if (!detail?.id) return;
      dispatch(toggleWidget(detail.id));
    };

    const onCols = (event: Event) => {
      const detail = (event as CustomEvent<DashboardWidgetColsDetail>).detail;
      if (!detail?.id || !detail.cols) return;
      dispatch(setWidgetCols({ id: detail.id, cols: detail.cols }));
    };

    window.addEventListener(MF_DASHBOARD_LAYOUT_CHANGED, onLayoutChanged);
    window.addEventListener(MF_DASHBOARD_WIDGET_TOGGLE, onToggle);
    window.addEventListener(MF_DASHBOARD_WIDGET_COLS, onCols);
    return () => {
      window.removeEventListener(MF_DASHBOARD_LAYOUT_CHANGED, onLayoutChanged);
      window.removeEventListener(MF_DASHBOARD_WIDGET_TOGGLE, onToggle);
      window.removeEventListener(MF_DASHBOARD_WIDGET_COLS, onCols);
    };
  }, [dispatch]);

  return (
    <>
      {mode === 'loading' && (
        <p className="text-muted-foreground mb-4 text-sm" role="status">
          Carregando editor de layout...
        </p>
      )}
      {mode === 'error' && (
        <p className="text-muted-foreground mb-4 text-sm" role="alert">
          O microfrontend do editor não respondeu em {MF_DASHBOARD_URL}. Verifique se o serviço mf-dashboard está em
          execução.
        </p>
      )}
      <div ref={hostRef} />
    </>
  );
}
