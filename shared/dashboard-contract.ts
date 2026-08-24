/** Contrato compartilhado entre host Next.js e mf-dashboard. */

export type WidgetId =
  | 'saldo'
  | 'evolucao'
  | 'comparativo'
  | 'categorias'
  | 'tipo'
  | 'forma'
  | 'anual'
  | 'compromissos'
  | 'extrato'
  | 'meta'
  | 'alerta'
  | 'notas';

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
  formaPagamento?: 'credito' | 'debito' | 'pix' | 'vr_va' | null;
}

export interface DashboardNotaUsuario {
  usuarioId: string;
  nome: string;
  html: string;
  /** Se false, só consulta (ex.: notas do cônjuge). */
  editavel: boolean;
}

export interface DashboardMfBaseProps {
  transacoes: DashboardTransacao[];
  widgets: DashboardWidget[];
  layoutRows: LayoutRow[];
  layoutGroups: LayoutGroupDefinition[];
  metaEconomia: number;
  alertaGastos: number;
  extratoLimite: number;
  /** HTML do bloco de notas (rascunho do usuário logado; compat). */
  blocoNotas: string;
  /** Notas por usuário conforme visão Eu / Cônjuge / Conjunta. */
  notasPorUsuario: DashboardNotaUsuario[];
  apiUrl: string;
  categoriaLabels?: Record<string, string>;
  /** Escopo da visão Eu / Cônjuge / Conjunta (host). */
  usuarioIds?: string[];
  /** Labels Você / nome do cônjuge para badges e breakdown. */
  donoLabels?: Record<string, string>;
  /** Loading ao trocar escopo (host). */
  loading?: boolean;
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
export const MF_BLOCO_NOTAS_CHANGED = 'fincontrol:bloco-notas-changed';

export interface BlocoNotasChangedDetail {
  html: string;
  usuarioId: string;
}

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

export function notifyBlocoNotasChanged(detail: BlocoNotasChangedDetail) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<BlocoNotasChangedDetail>(MF_BLOCO_NOTAS_CHANGED, { detail }));
}
