import { useMemo } from 'react';

import {
  DashboardLayoutEditor,
  SortableWidget,
} from '@/components/dashboard-layout-editor';
import { DashboardWidgetPreview, WIDGET_LABELS } from '@/components/dashboard-widget-preview';
import type { Transacao } from '@/data/transacoes';
import { buildWidgetAnalytics } from '@/lib/build-widget-analytics';
import { useDashboardCategoriaLabels } from '@/lib/use-dashboard-categoria-labels';
import { useDashboardGastosMensais } from '@/lib/use-dashboard-gastos-mensais';
import { useDashboardTransacoes } from '@/lib/use-dashboard-transacoes';

import type { DashboardEditorProps } from '../../../shared/dashboard-contract';
import {
  notifyDashboardLayoutChanged,
  notifyDashboardWidgetCols,
  notifyDashboardWidgetToggle,
} from '../../../shared/dashboard-contract';

export function DashboardEditorApp(props: Readonly<DashboardEditorProps>) {
  const { transacoes } = useDashboardTransacoes(props.transacoes as Transacao[], props.apiUrl, props.usuarioIds);
  const categoriaLabels = useDashboardCategoriaLabels(props.categoriaLabels, props.apiUrl);
  const { gastos } = useDashboardGastosMensais(props.apiUrl, props.usuarioIds);
  const analytics = useMemo(
    () => buildWidgetAnalytics(transacoes, categoriaLabels, gastos, props.donoLabels),
    [transacoes, categoriaLabels, gastos, props.donoLabels],
  );

  return (
    <DashboardLayoutEditor
      widgets={props.widgets ?? []}
      layoutRows={props.layoutRows ?? []}
      layoutGroups={props.layoutGroups ?? []}
      widgetLabels={WIDGET_LABELS}
      onLayoutChange={payload => notifyDashboardLayoutChanged(payload)}
      onToggleVisibility={id => notifyDashboardWidgetToggle({ id })}
      onSetCols={(id, cols) => notifyDashboardWidgetCols({ id, cols })}
      renderSortableWidget={(widget, { onToggleVisibility, onSetCols }) => (
        <SortableWidget
          widget={widget}
          label={WIDGET_LABELS[widget.id]}
          onToggleVisibility={onToggleVisibility}
          onSetCols={onSetCols}
        >
          <DashboardWidgetPreview
            id={widget.id}
            transacoes={transacoes}
            analytics={analytics}
            metaEconomia={props.metaEconomia}
            alertaGastos={props.alertaGastos}
            extratoLimite={props.extratoLimite}
            apiUrl={props.apiUrl}
            donoLabels={props.donoLabels}
          />
        </SortableWidget>
      )}
    />
  );
}
