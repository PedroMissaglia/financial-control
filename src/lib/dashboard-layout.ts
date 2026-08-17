import type {
  DashboardWidget,
  LayoutGroupDefinition,
  LayoutRow,
  WidgetCols,
  WidgetColStart,
  WidgetId,
} from '@/data/dashboard-profile';

export type LayoutBucket = 'left' | 'center' | 'right';

export type ColumnLayoutSegment = {
  type: 'columns';
  groupId: string;
  name: string;
  left: DashboardWidget[];
  center: DashboardWidget[];
  right: DashboardWidget[];
};

export type FullLayoutSegment = {
  type: 'full';
  widget: DashboardWidget;
};

export type DashboardLayoutSegment = ColumnLayoutSegment | FullLayoutSegment;

export function widgetBucket(widget: DashboardWidget): LayoutBucket {
  if (widget.cols === 12) return 'left';
  if (widget.cols === 6) return widget.colStart === 7 ? 'right' : 'left';
  if (widget.colStart === 9) return 'right';
  if (widget.colStart === 5) return 'center';
  return 'left';
}

function colStartForBucket(bucket: LayoutBucket, cols: WidgetCols): WidgetColStart {
  if (cols === 12) return 1;
  if (cols === 6) return bucket === 'right' ? 7 : 1;
  if (bucket === 'right') return 9;
  if (bucket === 'center') return 5;
  return 1;
}

function createLayoutGroupId(): string {
  return `group-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function emptyColumnGroup(name = 'Grupo de painéis'): ColumnLayoutSegment {
  return {
    type: 'columns',
    groupId: createLayoutGroupId(),
    name,
    left: [],
    center: [],
    right: [],
  };
}

function segmentHasWidgets(segment: ColumnLayoutSegment): boolean {
  return segment.left.length > 0 || segment.center.length > 0 || segment.right.length > 0;
}

function flattenLayoutSegments(segments: DashboardLayoutSegment[]): DashboardWidget[] {
  const result: DashboardWidget[] = [];

  for (const segment of segments) {
    if (segment.type === 'full') {
      result.push({ ...segment.widget, colStart: 1 });
      continue;
    }

    for (const bucket of ['left', 'center', 'right'] as const) {
      for (const widget of segment[bucket]) {
        result.push({
          ...widget,
          colStart: colStartForBucket(bucket, widget.cols),
        });
      }
    }
  }

  return result;
}

function segmentsToLayoutPersistence(segments: DashboardLayoutSegment[]): {
  layoutRows: LayoutRow[];
  layoutGroups: LayoutGroupDefinition[];
} {
  const layoutRows: LayoutRow[] = [];
  const layoutGroups: LayoutGroupDefinition[] = [];

  for (const segment of segments) {
    if (segment.type === 'full') {
      layoutRows.push({ type: 'full', widgetId: segment.widget.id });
      continue;
    }

    layoutRows.push({ type: 'group', groupId: segment.groupId });
    layoutGroups.push({
      id: segment.groupId,
      name: segment.name,
      left: segment.left.map(widget => widget.id),
      center: segment.center.map(widget => widget.id),
      right: segment.right.map(widget => widget.id),
    });
  }

  return { layoutRows, layoutGroups };
}

export function layoutPayloadFromSegments(segments: DashboardLayoutSegment[]): {
  widgets: DashboardWidget[];
  layoutRows: LayoutRow[];
  layoutGroups: LayoutGroupDefinition[];
} {
  return {
    widgets: flattenLayoutSegments(segments),
    ...segmentsToLayoutPersistence(segments),
  };
}

function buildDashboardLayout(
  widgets: DashboardWidget[],
  options?: { includeHidden?: boolean },
): DashboardLayoutSegment[] {
  const list = options?.includeHidden ? (widgets ?? []) : (widgets ?? []).filter(widget => widget.visible);
  const segments: DashboardLayoutSegment[] = [];
  let group = emptyColumnGroup();
  let groupCounter = 0;

  const flush = () => {
    if (!segmentHasWidgets(group)) return;
    groupCounter += 1;
    segments.push({
      ...group,
      groupId: group.groupId || createLayoutGroupId(),
      name: group.name || `Grupo de painéis ${groupCounter}`,
    });
    group = emptyColumnGroup(`Grupo de painéis ${groupCounter + 1}`);
  };

  for (const widget of list) {
    if (widget.cols === 12) {
      flush();
      segments.push({ type: 'full', widget });
      continue;
    }

    group[widgetBucket(widget)].push(widget);
  }

  flush();
  return segments;
}

export function migrateLayoutFromWidgets(widgets: DashboardWidget[]): {
  layoutRows: LayoutRow[];
  layoutGroups: LayoutGroupDefinition[];
} {
  return segmentsToLayoutPersistence(buildDashboardLayout(widgets, { includeHidden: true }));
}

function findWidgetInGroups(
  layoutGroups: LayoutGroupDefinition[],
  widgetId: WidgetId,
): { groupId: string; bucket: LayoutBucket } | null {
  for (const group of layoutGroups) {
    for (const bucket of ['left', 'center', 'right'] as const) {
      if (group[bucket].includes(widgetId)) return { groupId: group.id, bucket };
    }
  }
  return null;
}

function flatIndexInGroup(group: LayoutGroupDefinition, widgetId: WidgetId): number {
  return [...group.left, ...group.center, ...group.right].indexOf(widgetId);
}

function findGroupRowIndex(rows: LayoutRow[], groupId: string): number {
  return rows.findIndex(row => row.type === 'group' && row.groupId === groupId);
}

function findGroupForFullRow(rows: LayoutRow[], fullRowIndex: number): string | null {
  for (let index = fullRowIndex - 1; index >= 0; index -= 1) {
    const row = rows[index];
    if (row.type === 'group') return row.groupId;
  }
  return null;
}

function countFullWidgetsBeforeInGroup(
  rows: LayoutRow[],
  group: LayoutGroupDefinition,
  flatIndex: number,
): number {
  const order = [...group.left, ...group.center, ...group.right];
  let count = 0;
  for (let index = 0; index < flatIndex; index += 1) {
    const id = order[index];
    if (rows.some(row => row.type === 'full' && row.widgetId === id)) count += 1;
  }
  return count;
}

function insertFullWidgetAfterGroup(
  rows: LayoutRow[],
  groupId: string,
  widgetId: WidgetId,
  flatIndex: number,
  originalGroup: LayoutGroupDefinition,
): LayoutRow[] {
  const groupRowIndex = findGroupRowIndex(rows, groupId);
  if (groupRowIndex < 0) return [...rows, { type: 'full', widgetId }];

  const fullBefore = countFullWidgetsBeforeInGroup(rows, originalGroup, flatIndex);
  const insertAt = groupRowIndex + 1 + fullBefore;
  return [...rows.slice(0, insertAt), { type: 'full', widgetId }, ...rows.slice(insertAt)];
}

export function reconcileLayoutAfterWidgetColsChange(
  widgets: DashboardWidget[],
  layoutRows: LayoutRow[],
  layoutGroups: LayoutGroupDefinition[],
  widgetId: WidgetId,
): { layoutRows: LayoutRow[]; layoutGroups: LayoutGroupDefinition[] } {
  const widget = widgets.find(item => item.id === widgetId);
  if (!widget) return { layoutRows, layoutGroups };

  const groupEntry = findWidgetInGroups(layoutGroups, widgetId);
  const fullRowIndex = layoutRows.findIndex(row => row.type === 'full' && row.widgetId === widgetId);
  const parentGroupId =
    groupEntry?.groupId ?? (fullRowIndex >= 0 ? findGroupForFullRow(layoutRows, fullRowIndex) : null);
  const parentGroup = parentGroupId ? layoutGroups.find(group => group.id === parentGroupId) : null;
  const flatIndex = groupEntry && parentGroup ? flatIndexInGroup(parentGroup, widgetId) : -1;

  let rows = layoutRows.filter(row => row.type !== 'full' || row.widgetId !== widgetId);
  let groups = layoutGroups.map(group => ({
    ...group,
    left: group.left.filter(id => id !== widgetId),
    center: group.center.filter(id => id !== widgetId),
    right: group.right.filter(id => id !== widgetId),
  }));

  if (widget.cols === 12) {
    if (parentGroupId && parentGroup && flatIndex >= 0) {
      rows = insertFullWidgetAfterGroup(rows, parentGroupId, widgetId, flatIndex, parentGroup);
      return { layoutRows: rows, layoutGroups: groups };
    }

    if (parentGroupId) {
      const groupRowIndex = findGroupRowIndex(rows, parentGroupId);
      if (groupRowIndex >= 0) {
        const insertAt = groupRowIndex + 1;
        rows = [...rows.slice(0, insertAt), { type: 'full', widgetId }, ...rows.slice(insertAt)];
        return { layoutRows: rows, layoutGroups: groups };
      }
    }

    rows = [...rows, { type: 'full', widgetId }];
    return { layoutRows: rows, layoutGroups: groups };
  }

  const bucket = widgetBucket(widget);

  if (parentGroupId) {
    const targetGroup = groups.find(group => group.id === parentGroupId);
    if (targetGroup) {
      targetGroup[bucket].push(widgetId);
      if (!rows.some(row => row.type === 'group' && row.groupId === parentGroupId)) {
        rows = [{ type: 'group', groupId: parentGroupId }, ...rows];
      }
      return { layoutRows: rows, layoutGroups: groups };
    }
  }

  const existingGroupRow = rows.find(row => row.type === 'group');
  const existingGroupId = existingGroupRow?.type === 'group' ? existingGroupRow.groupId : null;
  const targetGroup = existingGroupId ? groups.find(group => group.id === existingGroupId) : groups[0];

  if (targetGroup) {
    targetGroup[bucket].push(widgetId);
    if (!rows.some(row => row.type === 'group' && row.groupId === targetGroup.id)) {
      rows = [{ type: 'group', groupId: targetGroup.id }, ...rows];
    }
    return { layoutRows: rows, layoutGroups: groups };
  }

  const id = createLayoutGroupId();
  groups = [...groups, { id, name: 'Grupo de painéis', left: [widgetId], center: [], right: [] }];
  rows = [{ type: 'group', groupId: id }, ...rows];
  return { layoutRows: rows, layoutGroups: groups };
}

function buildDashboardLayoutFromPersistence(
  widgets: DashboardWidget[],
  layoutRows: LayoutRow[],
  layoutGroups: LayoutGroupDefinition[],
  options?: { includeHidden?: boolean },
): DashboardLayoutSegment[] {
  const widgetMap = new Map((widgets ?? []).map(widget => [widget.id, widget]));
  const groupMap = new Map((layoutGroups ?? []).map(group => [group.id, group]));
  const segments: DashboardLayoutSegment[] = [];

  const resolveBucket = (ids: WidgetId[] | undefined) =>
    (ids ?? [])
      .map(id => widgetMap.get(id))
      .filter((widget): widget is DashboardWidget => !!widget && (options?.includeHidden || widget.visible))
      .map(widget => ({ ...widget }));

  for (const row of layoutRows ?? []) {
    if (row.type === 'full') {
      const widget = widgetMap.get(row.widgetId);
      if (!widget) continue;
      if (!options?.includeHidden && !widget.visible) continue;
      segments.push({ type: 'full', widget: { ...widget, colStart: 1 } });
      continue;
    }

    const groupDef = groupMap.get(row.groupId);
    if (!groupDef) continue;

    const segment: ColumnLayoutSegment = {
      type: 'columns',
      groupId: groupDef.id,
      name: groupDef.name,
      left: resolveBucket(groupDef.left),
      center: resolveBucket(groupDef.center),
      right: resolveBucket(groupDef.right),
    };

    if (options?.includeHidden || segmentHasWidgets(segment)) {
      segments.push(segment);
    }
  }

  return segments;
}

export function persistedLayoutPlacesWidgets(
  layoutRows: LayoutRow[] | undefined,
  layoutGroups: LayoutGroupDefinition[] | undefined,
  widgets: DashboardWidget[],
): boolean {
  if (!layoutRows?.length || !Array.isArray(layoutGroups) || widgets.length === 0) return false;

  const ids = new Set(widgets.map(widget => widget.id));
  for (const row of layoutRows) {
    if (row.type === 'full' && ids.has(row.widgetId)) return true;
  }
  for (const group of layoutGroups) {
    const placed = [...(group.left ?? []), ...(group.center ?? []), ...(group.right ?? [])];
    if (placed.some(id => ids.has(id))) return true;
  }
  return false;
}

export function resolveDashboardLayout(
  widgets: DashboardWidget[],
  layoutRows?: LayoutRow[],
  layoutGroups?: LayoutGroupDefinition[],
  options?: { includeHidden?: boolean },
): DashboardLayoutSegment[] {
  const list = widgets ?? [];
  if (persistedLayoutPlacesWidgets(layoutRows, layoutGroups, list)) {
    const persisted = buildDashboardLayoutFromPersistence(list, layoutRows ?? [], layoutGroups ?? [], options);
    if (persisted.length > 0) return persisted;
  }
  return buildDashboardLayout(list, options);
}
