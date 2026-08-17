/** Contrato compartilhado entre host Next.js e mf-dashboard. */

export type WidgetId =
  | 'saldo'
  | 'evolucao'
  | 'comparativo'
  | 'categorias'
  | 'extrato'
  | 'rapida'
  | 'meta'
  | 'alerta';

export type WidgetCols = 4 | 6 | 12;

export type WidgetColStart = 1 | 5 | 7 | 9;

export interface DashboardWidget {
  id: WidgetId;
  visible: boolean;
  cols: WidgetCols;
  colStart: WidgetColStart;
}

export type LayoutRow = { type: 'full'; widgetId: WidgetId } | { type: 'group'; groupId: string };

export interface LayoutGroupDefinition {
  id: string;
  name: string;
  left: WidgetId[];
  center: WidgetId[];
  right: WidgetId[];
}

export interface DashboardTransacao {
  id: string;
  usuarioId: string;
  tipo: 'deposito' | 'transferencia' | 'saque' | 'pagamento';
  valor: number;
  data: string;
  hora: string;
  descricao: string;
  categoria: string;
}

export interface DashboardMfBaseProps {
  transacoes: DashboardTransacao[];
  widgets: DashboardWidget[];
  layoutRows: LayoutRow[];
  layoutGroups: LayoutGroupDefinition[];
  metaEconomia: number;
  alertaGastos: number;
  extratoLimite: number;
  apiUrl: string;
}

export type DashboardViewProps = DashboardMfBaseProps;

export type DashboardEditorProps = DashboardMfBaseProps;

export interface DashboardLayoutChangedDetail {
  widgets: DashboardWidget[];
  layoutRows: LayoutRow[];
  layoutGroups: LayoutGroupDefinition[];
}

export interface DashboardWidgetToggleDetail {
  id: WidgetId;
}

export interface DashboardWidgetColsDetail {
  id: WidgetId;
  cols: WidgetCols;
}

export const MF_DASHBOARD_LAYOUT_CHANGED = 'fincontrol:dashboard-layout-changed';
export const MF_DASHBOARD_WIDGET_TOGGLE = 'fincontrol:dashboard-widget-toggle';
export const MF_DASHBOARD_WIDGET_COLS = 'fincontrol:dashboard-widget-cols';

export function notifyDashboardLayoutChanged(detail: DashboardLayoutChangedDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<DashboardLayoutChangedDetail>(MF_DASHBOARD_LAYOUT_CHANGED, { detail }));
}

export function notifyDashboardWidgetToggle(detail: DashboardWidgetToggleDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<DashboardWidgetToggleDetail>(MF_DASHBOARD_WIDGET_TOGGLE, { detail }));
}

export function notifyDashboardWidgetCols(detail: DashboardWidgetColsDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<DashboardWidgetColsDetail>(MF_DASHBOARD_WIDGET_COLS, { detail }));
}
