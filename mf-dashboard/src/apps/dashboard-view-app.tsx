import { useMemo } from 'react';

import { DashboardWidgetGrid } from '@/components/dashboard-widget-grid';
import {
  DashboardWidgetPreview,
  WIDGET_LABELS,
  WidgetSkeleton,
} from '@/components/dashboard-widget-preview';
import type { Transacao } from '@/data/transacoes';
import { buildWidgetAnalytics } from '@/lib/build-widget-analytics';
import { useDashboardCategoriaLabels } from '@/lib/use-dashboard-categoria-labels';
import { useDashboardGastosMensais } from '@/lib/use-dashboard-gastos-mensais';
import { useDashboardTransacoes } from '@/lib/use-dashboard-transacoes';

import type { DashboardViewProps, WidgetId } from '../../../shared/dashboard-contract';

export function DashboardViewApp(props: Readonly<DashboardViewProps>) {
  const { transacoes, loading: txLoading } = useDashboardTransacoes(
    props.transacoes as Transacao[],
    props.apiUrl,
    props.usuarioIds,
  );
  const categoriaLabels = useDashboardCategoriaLabels(props.categoriaLabels, props.apiUrl);
  const { gastos, loading: gastosLoading } = useDashboardGastosMensais(props.apiUrl, props.usuarioIds);
  const refreshing = Boolean(props.loading) || txLoading || gastosLoading;

  const analytics = useMemo(
    () => buildWidgetAnalytics(transacoes, categoriaLabels, gastos, props.donoLabels),
    [transacoes, categoriaLabels, gastos, props.donoLabels],
  );

  const widgets = props.widgets ?? [];

  return (
    <DashboardWidgetGrid
      widgets={widgets}
      layoutRows={props.layoutRows ?? []}
      layoutGroups={props.layoutGroups ?? []}
      renderWidget={widget =>
        refreshing ? (
          <WidgetSkeleton id={widget.id as WidgetId} />
        ) : (
          <DashboardWidgetPreview
            id={widget.id as WidgetId}
            transacoes={transacoes}
            analytics={analytics}
            metaEconomia={props.metaEconomia}
            alertaGastos={props.alertaGastos}
            extratoLimite={props.extratoLimite}
            apiUrl={props.apiUrl}
            donoLabels={props.donoLabels}
          />
        )
      }
    />
  );
}

export { WIDGET_LABELS };
