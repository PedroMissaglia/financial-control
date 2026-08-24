import type {
  DashboardWidget,
  LayoutGroupDefinition,
  LayoutRow,
} from './dashboard-contract';

export const DEFAULT_LAYOUT_GROUP_IDS = {
  resumo: 'default-resumo',
  graficos: 'default-graficos',
  metas: 'default-metas',
} as const;

export const DEFAULT_WIDGETS: DashboardWidget[] = [
  { id: 'saldo', visible: true, cols: 6, colStart: 1 },
  { id: 'evolucao', visible: true, cols: 6, colStart: 1 },
  { id: 'comparativo', visible: true, cols: 6, colStart: 7 },
  { id: 'categorias', visible: true, cols: 12, colStart: 1 },
  { id: 'extrato', visible: true, cols: 12, colStart: 1 },
  { id: 'meta', visible: true, cols: 6, colStart: 7 },
  { id: 'alerta', visible: true, cols: 6, colStart: 1 },
];

export function createDefaultDashboardLayout(): {
  widgets: DashboardWidget[];
  layoutRows: LayoutRow[];
  layoutGroups: LayoutGroupDefinition[];
} {
  const widgets = DEFAULT_WIDGETS.map(widget => ({ ...widget }));

  return {
    widgets,
    layoutRows: [
      { type: 'group', groupId: DEFAULT_LAYOUT_GROUP_IDS.resumo },
      { type: 'full', widgetId: 'extrato' },
      { type: 'group', groupId: DEFAULT_LAYOUT_GROUP_IDS.graficos },
      { type: 'full', widgetId: 'categorias' },
      { type: 'group', groupId: DEFAULT_LAYOUT_GROUP_IDS.metas },
    ],
    layoutGroups: [
      {
        id: DEFAULT_LAYOUT_GROUP_IDS.resumo,
        name: 'Visão geral',
        left: ['saldo'],
        center: [],
        right: [],
      },
      {
        id: DEFAULT_LAYOUT_GROUP_IDS.graficos,
        name: 'Gráficos',
        left: ['evolucao'],
        center: [],
        right: ['comparativo'],
      },
      {
        id: DEFAULT_LAYOUT_GROUP_IDS.metas,
        name: 'Metas e alertas',
        left: ['alerta'],
        center: [],
        right: ['meta'],
      },
    ],
  };
}
