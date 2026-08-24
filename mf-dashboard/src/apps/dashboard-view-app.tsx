import { useMemo, useState } from 'react';

import { DashboardWidgetGrid } from '@/components/dashboard-widget-grid';
import {
  DashboardWidgetPreview,
  WIDGET_LABELS,
  WidgetSkeleton,
} from '@/components/dashboard-widget-preview';
import { SelectMenu } from '@/components/ui/select-menu';
import { competenciaDe, mesesDoAnoAte } from '@/data/analises';
import type { Transacao } from '@/data/transacoes';
import { buildWidgetAnalytics } from '@/lib/build-widget-analytics';
import { useDashboardCategoriaLabels } from '@/lib/use-dashboard-categoria-labels';
import { useDashboardGastosMensais } from '@/lib/use-dashboard-gastos-mensais';
import { useDashboardTransacoes } from '@/lib/use-dashboard-transacoes';

import type { DashboardViewProps, WidgetId } from '../../../shared/dashboard-contract';

export function DashboardViewApp(props: Readonly<DashboardViewProps>) {
  const [competencia, setCompetencia] = useState(() => competenciaDe());
  const meses = useMemo(() => mesesDoAnoAte(competenciaDe()), []);
  const { transacoes, loading: txLoading } = useDashboardTransacoes(
    props.transacoes as Transacao[],
    props.apiUrl,
    props.usuarioIds,
  );
  const categoriaLabels = useDashboardCategoriaLabels(props.categoriaLabels, props.apiUrl);
  const { gastos, loading: gastosLoading } = useDashboardGastosMensais(
    props.apiUrl,
    props.usuarioIds,
    competencia,
  );
  const refreshing = Boolean(props.loading) || txLoading || gastosLoading;

  const analytics = useMemo(
    () => buildWidgetAnalytics(transacoes, categoriaLabels, gastos, props.donoLabels, competencia),
    [transacoes, categoriaLabels, gastos, props.donoLabels, competencia],
  );

  const widgets = props.widgets ?? [];
  const monthSelect = (
    <SelectMenu
      id="dashboard-mes"
      aria-label="Mês do painel"
      value={competencia}
      onChange={setCompetencia}
      options={meses.map(mes => ({ value: mes.competencia, label: mes.label }))}
      className="w-56"
    />
  );

  return (
    <DashboardWidgetGrid
      widgets={widgets}
      layoutRows={props.layoutRows ?? []}
      layoutGroups={props.layoutGroups ?? []}
      headerAccessory={monthSelect}
      renderWidget={widget =>
        refreshing && widget.id !== 'notas' ? (
          <WidgetSkeleton id={widget.id as WidgetId} />
        ) : (
          <DashboardWidgetPreview
            id={widget.id as WidgetId}
            transacoes={transacoes}
            analytics={analytics}
            metaEconomia={props.metaEconomia}
            alertaGastos={props.alertaGastos}
            extratoLimite={props.extratoLimite}
            blocoNotas={props.blocoNotas}
            notasPorUsuario={props.notasPorUsuario}
            apiUrl={props.apiUrl}
            donoLabels={props.donoLabels}
          />
        )
      }
    />
  );
}

export { WIDGET_LABELS };
