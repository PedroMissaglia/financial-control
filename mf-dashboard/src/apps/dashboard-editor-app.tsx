import {
  DashboardLayoutEditor,
  SortableWidget,
} from '@/components/dashboard-layout-editor';
import { DashboardWidgetPreview, WIDGET_LABELS } from '@/components/dashboard-widget-preview';
import type { Transacao } from '@/data/transacoes';
import { useDashboardTransacoes } from '@/lib/use-dashboard-transacoes';
import type { DashboardEditorProps } from '../../../shared/dashboard-contract';
import {
  notifyDashboardLayoutChanged,
  notifyDashboardWidgetCols,
  notifyDashboardWidgetToggle,
} from '../../../shared/dashboard-contract';

export function DashboardEditorApp(props: Readonly<DashboardEditorProps>) {
  const transacoes = useDashboardTransacoes(props.transacoes as Transacao[]);

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
            metaEconomia={props.metaEconomia}
            alertaGastos={props.alertaGastos}
            extratoLimite={props.extratoLimite}
          />
        </SortableWidget>
      )}
    />
  );
}
