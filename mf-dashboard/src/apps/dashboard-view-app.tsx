import { useMemo } from 'react';

import { DashboardWidgetGrid } from '@/components/dashboard-widget-grid';
import { DashboardWidgetPreview, WIDGET_LABELS } from '@/components/dashboard-widget-preview';
import type { Transacao } from '@/data/transacoes';
import { buildWidgetAnalytics } from '@/lib/build-widget-analytics';
import { useDashboardCategoriaLabels } from '@/lib/use-dashboard-categoria-labels';
import { useDashboardGastosMensais } from '@/lib/use-dashboard-gastos-mensais';
import { useDashboardTransacoes } from '@/lib/use-dashboard-transacoes';

import type { DashboardViewProps, WidgetId } from '../../../shared/dashboard-contract';

export function DashboardViewApp(props: Readonly<DashboardViewProps>) {
  const transacoes = useDashboardTransacoes(props.transacoes as Transacao[], props.apiUrl);
  const categoriaLabels = useDashboardCategoriaLabels(props.categoriaLabels, props.apiUrl);
  const gastos = useDashboardGastosMensais(props.apiUrl);
  const analytics = useMemo(
    () => buildWidgetAnalytics(transacoes, categoriaLabels, gastos),
    [transacoes, categoriaLabels, gastos],
  );

  return (
    <DashboardWidgetGrid
      widgets={props.widgets ?? []}
      layoutRows={props.layoutRows ?? []}
      layoutGroups={props.layoutGroups ?? []}
      renderWidget={widget => (
        <DashboardWidgetPreview
          id={widget.id as WidgetId}
          transacoes={transacoes}
          analytics={analytics}
          metaEconomia={props.metaEconomia}
          alertaGastos={props.alertaGastos}
          extratoLimite={props.extratoLimite}
          apiUrl={props.apiUrl}
        />
      )}
    />
  );
}

export { WIDGET_LABELS };
