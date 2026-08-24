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
  { id: 'compromissos', visible: true, cols: 6, colStart: 1 },
  { id: 'extrato', visible: true, cols: 6, colStart: 7 },
  { id: 'comparativo', visible: true, cols: 6, colStart: 1 },
  { id: 'tipo', visible: true, cols: 6, colStart: 1 },
  { id: 'categorias', visible: true, cols: 6, colStart: 7 },
  { id: 'forma', visible: true, cols: 6, colStart: 7 },
  { id: 'evolucao', visible: true, cols: 12, colStart: 1 },
  { id: 'anual', visible: true, cols: 12, colStart: 1 },
  { id: 'alerta', visible: true, cols: 6, colStart: 1 },
  { id: 'meta', visible: true, cols: 6, colStart: 7 },
  { id: 'notas', visible: true, cols: 12, colStart: 1 },
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
      { type: 'full', widgetId: 'notas' },
      { type: 'group', groupId: DEFAULT_LAYOUT_GROUP_IDS.graficos },
      { type: 'full', widgetId: 'evolucao' },
      { type: 'full', widgetId: 'anual' },
      { type: 'group', groupId: DEFAULT_LAYOUT_GROUP_IDS.metas },
    ],
    layoutGroups: [
      {
        id: DEFAULT_LAYOUT_GROUP_IDS.resumo,
        name: 'Sessão principal',
        left: ['saldo', 'compromissos'],
        center: [],
        right: ['extrato'],
      },
      {
        id: DEFAULT_LAYOUT_GROUP_IDS.graficos,
        name: 'Gráficos',
        left: ['comparativo', 'tipo'],
        center: [],
        right: ['categorias', 'forma'],
      },
      {
        id: DEFAULT_LAYOUT_GROUP_IDS.metas,
        name: 'Metas',
        left: ['alerta'],
        center: [],
        right: ['meta'],
      },
    ],
  };
}
