import { DashboardWidgetGrid } from '@/components/dashboard-widget-grid';
import { DashboardWidgetPreview, WIDGET_LABELS } from '@/components/dashboard-widget-preview';
import type { Transacao } from '@/data/transacoes';
import { useDashboardTransacoes } from '@/lib/use-dashboard-transacoes';
import type { DashboardViewProps, WidgetId } from '../../../shared/dashboard-contract';

export function DashboardViewApp(props: Readonly<DashboardViewProps>) {
  const transacoes = useDashboardTransacoes(props.transacoes as Transacao[]);

  return (
    <DashboardWidgetGrid
      widgets={props.widgets ?? []}
      layoutRows={props.layoutRows ?? []}
      layoutGroups={props.layoutGroups ?? []}
      renderWidget={widget => (
        <DashboardWidgetPreview
          id={widget.id as WidgetId}
          transacoes={transacoes}
          metaEconomia={props.metaEconomia}
          alertaGastos={props.alertaGastos}
          extratoLimite={props.extratoLimite}
        />
      )}
    />
  );
}

export { WIDGET_LABELS };
