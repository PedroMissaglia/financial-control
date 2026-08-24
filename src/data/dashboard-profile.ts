import {
  type AppThemeId,
  type AppThemeMode,
  DEFAULT_APP_THEME,
  DEFAULT_APP_THEME_MODE,
  resolveAppTheme,
  resolveAppThemeMode,
} from '@/data/app-themes';
import { migrateLayoutFromWidgets, persistedLayoutPlacesWidgets } from '@/lib/dashboard-layout';
import { FILTROS_VAZIOS, mergeTransacoesFiltros, type TransacoesFiltros } from '@/lib/transacao-filters';

import {
  createDefaultDashboardLayout,
  DEFAULT_WIDGETS,
} from '../../shared/dashboard-default-layout';

export type WidgetId =
  | 'saldo'
  | 'evolucao'
  | 'comparativo'
  | 'categorias'
  | 'extrato'
  | 'meta'
  | 'alerta';

export type WidgetCols = 4 | 6 | 12;

export type WidgetColStart = 1 | 5 | 7 | 9;

export function validColStarts(cols: WidgetCols): WidgetColStart[] {
  if (cols === 12) return [1];
  if (cols === 6) return [1, 7];
  return [1, 5, 9];
}

export function normalizeColStart(cols: WidgetCols, value: unknown): WidgetColStart {
  const allowed = validColStarts(cols);
  if (allowed.includes(value as WidgetColStart)) return value as WidgetColStart;
  return allowed[0];
}

export function normalizeWidgetCols(value: unknown): WidgetCols {
  if (value === 6 || value === 12) return value;
  if (value === 4 || value === 1) return 6;
  if (value === 2) return 12;
  return 6;
}

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

export interface DashboardProfile {
  id: string;
  usuarioId: string;
  theme: AppThemeId;
  themeMode: AppThemeMode;
  metaEconomia: number;
  alertaGastos: number;
  transacoesPageSize: number;
  transacoesFiltros: TransacoesFiltros;
  extratoLimite: number;
  widgets: DashboardWidget[];
  layoutRows?: LayoutRow[];
  layoutGroups?: LayoutGroupDefinition[];
}

export const TRANSACOES_PAGE_SIZE_OPTIONS = [5, 8, 10, 20] as const;

export type TransacoesPageSize = (typeof TRANSACOES_PAGE_SIZE_OPTIONS)[number];

export const DEFAULT_TRANSACOES_PAGE_SIZE: TransacoesPageSize = 8;

export function normalizeTransacoesPageSize(value: unknown): TransacoesPageSize {
  return TRANSACOES_PAGE_SIZE_OPTIONS.includes(value as TransacoesPageSize)
    ? (value as TransacoesPageSize)
    : DEFAULT_TRANSACOES_PAGE_SIZE;
}

export const EXTRATO_LIMITE_OPTIONS = [5, 8, 10, 15] as const;

export type ExtratoLimite = (typeof EXTRATO_LIMITE_OPTIONS)[number];

export const DEFAULT_EXTRATO_LIMITE: ExtratoLimite = 10;

export function normalizeExtratoLimite(value: unknown): ExtratoLimite {
  return EXTRATO_LIMITE_OPTIONS.includes(value as ExtratoLimite)
    ? (value as ExtratoLimite)
    : DEFAULT_EXTRATO_LIMITE;
}

export { createDefaultDashboardLayout, DEFAULT_WIDGETS } from '../../shared/dashboard-default-layout';

function expandLegacyGraficosWidget(widget: {
  visible?: boolean;
  cols?: unknown;
  colStart?: unknown;
}): DashboardWidget[] {
  const cols = normalizeWidgetCols(widget.cols);
  const visible = widget.visible !== false;

  return [
    { id: 'evolucao', visible, cols: cols === 12 ? 6 : cols, colStart: 1 },
    { id: 'comparativo', visible, cols: cols === 12 ? 6 : cols, colStart: 7 },
    { id: 'categorias', visible, cols: 12, colStart: 1 },
  ];
}

function restoreStoredWidget(widget: {
  id: string;
  visible?: boolean;
  cols?: unknown;
  colStart?: unknown;
}): DashboardWidget[] {
  if (widget.id === 'graficos') {
    return expandLegacyGraficosWidget(widget);
  }

  const known = new Set(DEFAULT_WIDGETS.map(item => item.id));
  if (!known.has(widget.id as WidgetId)) return [];

  const cols = normalizeWidgetCols(widget.cols);
  return [
    {
      id: widget.id as WidgetId,
      visible: widget.visible !== false,
      cols,
      colStart: normalizeColStart(cols, widget.colStart),
    },
  ];
}

export function defaultProfile(usuarioId: string): DashboardProfile {
  const { widgets, layoutRows, layoutGroups } = createDefaultDashboardLayout();

  return {
    id: usuarioId,
    usuarioId,
    theme: DEFAULT_APP_THEME,
    themeMode: DEFAULT_APP_THEME_MODE,
    metaEconomia: 800,
    alertaGastos: 2500,
    transacoesPageSize: DEFAULT_TRANSACOES_PAGE_SIZE,
    transacoesFiltros: { ...FILTROS_VAZIOS },
    extratoLimite: DEFAULT_EXTRATO_LIMITE,
    widgets,
    layoutRows,
    layoutGroups,
  };
}

function normalizeLayoutGroup(group: LayoutGroupDefinition): LayoutGroupDefinition {
  const known = new Set(DEFAULT_WIDGETS.map(item => item.id));
  const keep = (ids: WidgetId[]) => ids.filter(id => known.has(id));

  return {
    id: group.id,
    name: group.name || 'Grupo de painéis',
    left: keep(Array.isArray(group.left) ? group.left : []),
    center: keep(Array.isArray(group.center) ? group.center : []),
    right: keep(Array.isArray(group.right) ? group.right : []),
  };
}

export function mergeProfile(stored: Partial<DashboardProfile> | null | undefined, usuarioId: string): DashboardProfile {
  const base = defaultProfile(usuarioId);
  if (!stored) return base;

  const restored = Array.isArray(stored.widgets)
    ? stored.widgets.flatMap(widget => restoreStoredWidget(widget))
    : [];

  for (const widget of DEFAULT_WIDGETS) {
    if (!restored.some(item => item.id === widget.id)) restored.push({ ...widget });
  }

  const storedGroups = Array.isArray(stored.layoutGroups)
    ? stored.layoutGroups.map(normalizeLayoutGroup)
    : undefined;
  const storedRows = Array.isArray(stored.layoutRows) ? stored.layoutRows : undefined;
  const { layoutRows, layoutGroups } =
    storedRows && storedGroups && persistedLayoutPlacesWidgets(storedRows, storedGroups, restored)
      ? { layoutRows: storedRows, layoutGroups: storedGroups }
      : migrateLayoutFromWidgets(restored);

  return {
    id: usuarioId,
    usuarioId,
    theme: resolveAppTheme(stored.theme),
    themeMode: resolveAppThemeMode(stored.themeMode),
    metaEconomia: typeof stored.metaEconomia === 'number' ? stored.metaEconomia : base.metaEconomia,
    alertaGastos: typeof stored.alertaGastos === 'number' ? stored.alertaGastos : base.alertaGastos,
    transacoesPageSize: normalizeTransacoesPageSize(stored.transacoesPageSize),
    transacoesFiltros: mergeTransacoesFiltros(stored.transacoesFiltros),
    extratoLimite: normalizeExtratoLimite(stored.extratoLimite),
    widgets: restored,
    layoutRows,
    layoutGroups,
  };
}
