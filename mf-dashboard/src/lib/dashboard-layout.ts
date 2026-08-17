import type {
  DashboardWidget,
  LayoutGroupDefinition,
  LayoutRow,
  WidgetColStart,
  WidgetCols,
  WidgetId,
} from '../../../shared/dashboard-contract';

export type LayoutBucket = 'left' | 'center' | 'right';

export type ColumnLayoutSegment = {
  /** Agrupador de painéis 6 col: colunas esquerda, central (opcional) e direita. */
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

export function colStartForBucket(bucket: LayoutBucket, cols: WidgetCols): WidgetColStart {
  if (cols === 12) return 1;
  if (cols === 6) return bucket === 'right' ? 7 : 1;
  if (bucket === 'right') return 9;
  if (bucket === 'center') return 5;
  return 1;
}

export function containerId(segmentIndex: number, bucket: LayoutBucket): string {
  return `segment-${segmentIndex}-${bucket}`;
}

export function appendContainerId(segmentIndex: number, bucket: LayoutBucket): string {
  return `${containerId(segmentIndex, bucket)}-append`;
}

/** Zona de drop abaixo de um grupo inteiro (segmento columns). */
export function segmentGroupAppendId(segmentIndex: number): string {
  return `segment-${segmentIndex}-group-append`;
}

export function parseSegmentGroupAppendId(id: string): { segmentIndex: number } | null {
  const match = id.match(/^segment-(\d+)-group-append$/);
  if (!match) return null;
  return { segmentIndex: Number(match[1]) };
}

export type InsertPlacement = 'before' | 'after' | 'end';

export function parseContainerId(id: string): { segmentIndex: number; bucket: LayoutBucket } | null {
  const match = id.match(/^segment-(\d+)-(left|center|right)$/);
  if (!match) return null;
  return { segmentIndex: Number(match[1]), bucket: match[2] as LayoutBucket };
}

export function parseAppendContainerId(id: string): { segmentIndex: number; bucket: LayoutBucket } | null {
  const match = id.match(/^segment-(\d+)-(left|center|right)-append$/);
  if (!match) return null;
  return { segmentIndex: Number(match[1]), bucket: match[2] as LayoutBucket };
}

export function isColumnDropTarget(id: string): boolean {
  return parseContainerId(id) !== null || parseAppendContainerId(id) !== null;
}

export function fullWidgetAppendId(widgetId: WidgetId): string {
  return `full-${widgetId}-append`;
}

export function layoutAppendId(): string {
  return 'layout-append';
}

export function parseFullWidgetAppendId(id: string): WidgetId | null {
  const match = id.match(/^full-(.+)-append$/);
  return match ? (match[1] as WidgetId) : null;
}

export type WidgetLocation =
  | { kind: 'full'; segmentIndex: number }
  | { kind: 'column'; segmentIndex: number; bucket: LayoutBucket; index: number };

export function findWidgetLocation(
  segments: DashboardLayoutSegment[],
  widgetId: WidgetId,
): WidgetLocation | null {
  for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
    const segment = segments[segmentIndex];
    if (segment.type === 'full' && segment.widget.id === widgetId) {
      return { kind: 'full', segmentIndex };
    }
    if (segment.type === 'columns') {
      for (const bucket of ['left', 'center', 'right'] as const) {
        const index = segment[bucket].findIndex(widget => widget.id === widgetId);
        if (index >= 0) return { kind: 'column', segmentIndex, bucket, index };
      }
    }
  }
  return null;
}

type DropTarget =
  | { kind: 'full'; widgetId: WidgetId; placement: 'before' | 'after' }
  | { kind: 'full-append'; widgetId: WidgetId }
  | { kind: 'column'; segmentIndex: number; bucket: LayoutBucket; overId: string; placement: InsertPlacement }
  | { kind: 'after-segment'; segmentIndex: number }
  | { kind: 'layout-append' };

function resolveDropTarget(
  segments: DashboardLayoutSegment[],
  overId: string,
  placement: InsertPlacement,
  activeWidget: DashboardWidget,
): DropTarget | null {
  if (overId === layoutAppendId()) return { kind: 'layout-append' };

  const fullAppendWidgetId = parseFullWidgetAppendId(overId);
  if (fullAppendWidgetId) return { kind: 'full-append', widgetId: fullAppendWidgetId };

  const groupAppend = parseSegmentGroupAppendId(overId);
  if (groupAppend) return { kind: 'after-segment', segmentIndex: groupAppend.segmentIndex };

  const appendParsed = parseAppendContainerId(overId);
  if (appendParsed) {
    if (activeWidget.cols === 12) {
      return { kind: 'after-segment', segmentIndex: appendParsed.segmentIndex };
    }
    return {
      kind: 'column',
      segmentIndex: appendParsed.segmentIndex,
      bucket: appendParsed.bucket,
      overId,
      placement: 'end',
    };
  }

  const containerParsed = parseContainerId(overId);
  if (containerParsed) {
    if (activeWidget.cols === 12) {
      return { kind: 'after-segment', segmentIndex: containerParsed.segmentIndex };
    }
    return {
      kind: 'column',
      segmentIndex: containerParsed.segmentIndex,
      bucket: containerParsed.bucket,
      overId,
      placement: 'end',
    };
  }

  const location = findWidgetLocation(segments, overId as WidgetId);
  if (!location) return null;

  if (location.kind === 'full') {
    return { kind: 'full', widgetId: overId as WidgetId, placement: placement === 'after' ? 'after' : 'before' };
  }

  if (activeWidget.cols === 12) {
    return {
      kind: 'after-segment',
      segmentIndex: location.segmentIndex + (placement === 'after' ? 1 : 0),
    };
  }

  return {
    kind: 'column',
    segmentIndex: location.segmentIndex,
    bucket: location.bucket,
    overId,
    placement,
  };
}

function removeWidgetFromSegments(
  segments: DashboardLayoutSegment[],
  widgetId: WidgetId,
): { next: DashboardLayoutSegment[]; widget: DashboardWidget | null } {
  const location = findWidgetLocation(segments, widgetId);
  if (!location) return { next: segments, widget: null };

  const next = cloneLayoutSegments(segments);

  if (location.kind === 'full') {
    const segment = next[location.segmentIndex];
    if (segment.type !== 'full') return { next: segments, widget: null };
    const widget = { ...segment.widget };
    next.splice(location.segmentIndex, 1);
    return { next, widget };
  }

  const segment = next[location.segmentIndex];
  if (segment.type !== 'columns') return { next: segments, widget: null };

  const list = segment[location.bucket];
  const [widget] = list.splice(location.index, 1);
  return { next, widget: { ...widget } };
}

function insertWidgetAtSegmentIndex(
  segments: DashboardLayoutSegment[],
  widget: DashboardWidget,
  index: number,
): DashboardLayoutSegment[] {
  const next = cloneLayoutSegments(segments);
  const insertIndex = Math.max(0, Math.min(index, next.length));

  if (widget.cols === 12) {
    next.splice(insertIndex, 0, { type: 'full', widget: { ...widget, colStart: 1 } });
    return next;
  }

  const bucket = widgetBucket(widget);
  const normalizedWidget = { ...widget, colStart: colStartForBucket(bucket, widget.cols) };
  const existing = next[insertIndex];

  if (existing?.type === 'columns') {
    existing[bucket].push(normalizedWidget);
    return next;
  }

  const columnSegment = createEmptyColumnGroup('Grupo de painéis');
  columnSegment[bucket].push(normalizedWidget);
  next.splice(insertIndex, 0, columnSegment);
  return next;
}

function insertWidgetAtColumnTarget(
  segments: DashboardLayoutSegment[],
  widget: DashboardWidget,
  target: Extract<DropTarget, { kind: 'column' }>,
): DashboardLayoutSegment[] {
  if (widget.cols === 12) {
    return insertWidgetAtSegmentIndex(segments, widget, target.segmentIndex + 1);
  }

  const normalizedWidget = {
    ...widget,
    colStart: colStartForBucket(target.bucket, widget.cols),
  };
  const next = cloneLayoutSegments(segments);
  const segment = next[target.segmentIndex];

  if (segment?.type !== 'columns') {
    const columnSegment = createEmptyColumnGroup('Grupo de painéis');
    columnSegment[target.bucket].push(normalizedWidget);
    next.splice(target.segmentIndex, 0, columnSegment);
    return next;
  }

  const list = segment[target.bucket];
  let insertIndex = list.length;
  if (target.placement !== 'end' && !isColumnDropTarget(target.overId)) {
    const overIndex = list.findIndex(item => item.id === target.overId);
    if (overIndex >= 0) {
      insertIndex = target.placement === 'after' ? overIndex + 1 : overIndex;
    }
  }
  list.splice(insertIndex, 0, normalizedWidget);
  return next;
}

function insertWidgetAtTarget(
  segments: DashboardLayoutSegment[],
  widget: DashboardWidget,
  target: DropTarget,
): DashboardLayoutSegment[] {
  if (target.kind === 'layout-append') {
    return insertWidgetAtSegmentIndex(segments, widget, segments.length);
  }

  if (target.kind === 'after-segment') {
    return insertWidgetAtSegmentIndex(segments, widget, target.segmentIndex + 1);
  }

  if (target.kind === 'full-append') {
    const fullIndex = segments.findIndex(
      segment => segment.type === 'full' && segment.widget.id === target.widgetId,
    );
    if (fullIndex < 0) return insertWidgetAtSegmentIndex(segments, widget, segments.length);
    return insertWidgetAtSegmentIndex(segments, widget, fullIndex + 1);
  }

  if (target.kind === 'full') {
    const fullIndex = segments.findIndex(
      segment => segment.type === 'full' && segment.widget.id === target.widgetId,
    );
    if (fullIndex < 0) return insertWidgetAtSegmentIndex(segments, widget, segments.length);
    const insertIndex = target.placement === 'after' ? fullIndex + 1 : fullIndex;
    return insertWidgetAtSegmentIndex(segments, widget, insertIndex);
  }

  return insertWidgetAtColumnTarget(segments, widget, target);
}

export function moveWidgetInSegments(
  segments: DashboardLayoutSegment[],
  widgetId: WidgetId,
  overId: string,
  placement: InsertPlacement,
): DashboardLayoutSegment[] {
  const activeLocation = findWidgetLocation(segments, widgetId);
  if (!activeLocation) return segments;

  const activeWidget =
    activeLocation.kind === 'full'
      ? (segments[activeLocation.segmentIndex] as FullLayoutSegment).widget
      : (segments[activeLocation.segmentIndex] as ColumnLayoutSegment)[activeLocation.bucket][activeLocation.index];

  if (!activeWidget) return segments;

  const overColumnContainer = findContainer(overId, segments);
  if (activeLocation.kind === 'column' && overColumnContainer && activeWidget.cols !== 12) {
    return moveWidgetInLayout(
      segments,
      widgetId,
      { segmentIndex: activeLocation.segmentIndex, bucket: activeLocation.bucket },
      overColumnContainer,
      overId,
      placement,
    );
  }

  if (activeLocation.kind === 'full' && overId === widgetId) return segments;

  const target = resolveDropTarget(segments, overId, placement, activeWidget);
  if (!target) return segments;

  if (
    target.kind === 'full' &&
    target.widgetId === widgetId &&
    activeLocation.kind === 'full' &&
    target.placement === 'before'
  ) {
    return segments;
  }

  const { next, widget } = removeWidgetFromSegments(segments, widgetId);
  if (!widget) return segments;

  return insertWidgetAtTarget(next, widget, target);
}

export function findContainer(
  id: string,
  segments: DashboardLayoutSegment[],
): { segmentIndex: number; bucket: LayoutBucket } | null {
  const appendParsed = parseAppendContainerId(id);
  if (appendParsed) return appendParsed;

  const parsed = parseContainerId(id);
  if (parsed) return parsed;

  for (let segmentIndex = 0; segmentIndex < segments.length; segmentIndex++) {
    const segment = segments[segmentIndex];
    if (segment.type !== 'columns') continue;
    if (segment.left.some(widget => widget.id === id)) return { segmentIndex, bucket: 'left' };
    if (segment.center.some(widget => widget.id === id)) return { segmentIndex, bucket: 'center' };
    if (segment.right.some(widget => widget.id === id)) return { segmentIndex, bucket: 'right' };
  }

  return null;
}

function emptyColumnGroup(name = 'Grupo de painéis'): ColumnLayoutSegment {
  return createEmptyColumnGroup(name);
}

export function createLayoutGroupId(): string {
  return `group-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createEmptyColumnGroup(name: string, groupId = createLayoutGroupId()): ColumnLayoutSegment {
  return {
    type: 'columns',
    groupId,
    name,
    left: [],
    center: [],
    right: [],
  };
}

export function insertEmptyLayoutGroup(
  segments: DashboardLayoutSegment[],
  insertIndex: number,
  name = 'Novo grupo',
): DashboardLayoutSegment[] {
  const next = cloneLayoutSegments(segments);
  next.splice(insertIndex, 0, createEmptyColumnGroup(name));
  return next;
}

export function updateSegmentGroupName(
  segments: DashboardLayoutSegment[],
  groupId: string,
  name: string,
): DashboardLayoutSegment[] {
  const trimmed = name.trim();
  if (!trimmed) return segments;

  return segments.map(segment =>
    segment.type === 'columns' && segment.groupId === groupId ? { ...segment, name: trimmed } : segment,
  );
}

function findColumnGroupIndex(segments: DashboardLayoutSegment[], groupId: string): number {
  return segments.findIndex(segment => segment.type === 'columns' && segment.groupId === groupId);
}

function collectFullSegmentsAfter(
  segments: DashboardLayoutSegment[],
  startIndex: number,
): FullLayoutSegment[] {
  const fullSegments: FullLayoutSegment[] = [];
  let index = startIndex + 1;
  while (index < segments.length && segments[index].type === 'full') {
    fullSegments.push(segments[index] as FullLayoutSegment);
    index += 1;
  }
  return fullSegments;
}

function insertFullSegmentsAfterGroup(
  segments: DashboardLayoutSegment[],
  groupIndex: number,
  fullSegments: FullLayoutSegment[],
): void {
  let insertAt = groupIndex + 1;
  while (insertAt < segments.length && segments[insertAt].type === 'full') {
    insertAt += 1;
  }
  segments.splice(insertAt, 0, ...fullSegments);
}

export function getRemoveLayoutGroupTarget(
  segments: DashboardLayoutSegment[],
  groupId: string,
): 'above' | 'below' | null {
  const segmentIndex = findColumnGroupIndex(segments, groupId);
  if (segmentIndex < 0) return null;

  for (let index = segmentIndex - 1; index >= 0; index -= 1) {
    if (segments[index].type === 'columns') return 'above';
  }

  for (let index = segmentIndex + 1; index < segments.length; index += 1) {
    if (segments[index].type === 'columns') return 'below';
  }

  return null;
}

export function canRemoveLayoutGroup(segments: DashboardLayoutSegment[], groupId: string): boolean {
  const columnGroupCount = segments.filter(segment => segment.type === 'columns').length;
  if (columnGroupCount <= 1) return false;
  return findColumnGroupIndex(segments, groupId) >= 0;
}

export function removeLayoutGroup(
  segments: DashboardLayoutSegment[],
  groupId: string,
): DashboardLayoutSegment[] | null {
  if (!canRemoveLayoutGroup(segments, groupId)) return null;

  const segmentIndex = findColumnGroupIndex(segments, groupId);
  const toDelete = segments[segmentIndex] as ColumnLayoutSegment;
  const orphanedFull = collectFullSegmentsAfter(segments, segmentIndex);
  const deleteCount = 1 + orphanedFull.length;
  const targetDirection = getRemoveLayoutGroupTarget(segments, groupId);
  if (!targetDirection) return null;

  const next = cloneLayoutSegments(segments);

  if (targetDirection === 'above') {
    let previousGroupIndex = -1;
    for (let index = segmentIndex - 1; index >= 0; index -= 1) {
      if (next[index].type === 'columns') {
        previousGroupIndex = index;
        break;
      }
    }
    if (previousGroupIndex < 0) return null;

    const target = next[previousGroupIndex] as ColumnLayoutSegment;
    next[previousGroupIndex] = {
      ...target,
      left: [...target.left, ...toDelete.left],
      center: [...target.center, ...toDelete.center],
      right: [...target.right, ...toDelete.right],
    };
    next.splice(segmentIndex, deleteCount);
    insertFullSegmentsAfterGroup(next, previousGroupIndex, orphanedFull);
    return next;
  }

  let nextGroupIndex = -1;
  for (let index = segmentIndex + 1; index < next.length; index += 1) {
    if (next[index].type === 'columns') {
      nextGroupIndex = index;
      break;
    }
  }
  if (nextGroupIndex < 0) return null;

  const below = next[nextGroupIndex] as ColumnLayoutSegment;
  next[nextGroupIndex] = {
    ...below,
    left: [...toDelete.left, ...below.left],
    center: [...toDelete.center, ...below.center],
    right: [...toDelete.right, ...below.right],
  };
  next.splice(segmentIndex, deleteCount);

  const mergedGroupIndex = segmentIndex;
  insertFullSegmentsAfterGroup(next, mergedGroupIndex, orphanedFull);
  return next;
}

export function segmentsToLayoutPersistence(segments: DashboardLayoutSegment[]): {
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

export function segmentsLayoutSignature(segments: DashboardLayoutSegment[]): string {
  return JSON.stringify(segmentsToLayoutPersistence(segments));
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
    groupEntry?.groupId ??
    (fullRowIndex >= 0 ? findGroupForFullRow(layoutRows, fullRowIndex) : null);
  const parentGroup = parentGroupId ? layoutGroups.find(group => group.id === parentGroupId) : null;
  const flatIndex =
    groupEntry && parentGroup ? flatIndexInGroup(parentGroup, widgetId) : -1;

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

export function buildDashboardLayoutFromPersistence(
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

function segmentHasWidgets(segment: ColumnLayoutSegment): boolean {
  return segment.left.length > 0 || segment.center.length > 0 || segment.right.length > 0;
}

export function segmentUsesThreeColumns(segment: ColumnLayoutSegment): boolean {
  if (segment.center.length > 0) return true;
  const all = [...segment.left, ...segment.center, ...segment.right];
  return all.length > 0 && all.every(widget => widget.cols === 4);
}

export function buildDashboardLayout(
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

export function flattenLayoutSegments(segments: DashboardLayoutSegment[]): DashboardWidget[] {
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

export function cloneLayoutSegments(segments: DashboardLayoutSegment[]): DashboardLayoutSegment[] {
  return segments.map(segment => {
    if (segment.type === 'full') {
      return { type: 'full', widget: { ...segment.widget } };
    }

    return {
      type: 'columns',
      groupId: segment.groupId,
      name: segment.name,
      left: segment.left.map(widget => ({ ...widget })),
      center: segment.center.map(widget => ({ ...widget })),
      right: segment.right.map(widget => ({ ...widget })),
    };
  });
}

export function arrayMoveWidgets<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function getColumnSegment(
  segments: DashboardLayoutSegment[],
  segmentIndex: number,
): ColumnLayoutSegment | null {
  const segment = segments[segmentIndex];
  return segment?.type === 'columns' ? segment : null;
}

export function buildEditorColumns(
  widgets: DashboardWidget[],
  options?: { includeHidden?: boolean },
): ColumnLayoutSegment {
  const list = options?.includeHidden ? (widgets ?? []) : (widgets ?? []).filter(widget => widget.visible);
  const group = emptyColumnGroup();

  for (const widget of list) {
    if (widget.cols === 12) continue;
    group[widgetBucket(widget)].push(widget);
  }

  return group;
}

/** Reconstrói a lista global preservando posição dos painéis full-width. */
export function flattenEditorLayout(
  columns: ColumnLayoutSegment,
  widgets: DashboardWidget[],
): DashboardWidget[] {
  const orderedPartials = [
    ...columns.left.map(widget => ({ ...widget, colStart: colStartForBucket('left', widget.cols) })),
    ...columns.center.map(widget => ({ ...widget, colStart: colStartForBucket('center', widget.cols) })),
    ...columns.right.map(widget => ({ ...widget, colStart: colStartForBucket('right', widget.cols) })),
  ];

  let partialIndex = 0;
  return widgets.map(widget => {
    if (widget.cols === 12) {
      return { ...widget, colStart: 1 as WidgetColStart };
    }
    const next = orderedPartials[partialIndex];
    partialIndex += 1;
    return next ?? widget;
  });
}

export function cloneEditorColumns(columns: ColumnLayoutSegment): ColumnLayoutSegment {
  return {
    type: 'columns',
    groupId: columns.groupId,
    name: columns.name,
    left: columns.left.map(widget => ({ ...widget })),
    center: columns.center.map(widget => ({ ...widget })),
    right: columns.right.map(widget => ({ ...widget })),
  };
}

export function editorColumnsToSegments(columns: ColumnLayoutSegment): DashboardLayoutSegment[] {
  return [columns];
}

export function moveWidgetInColumns(
  columns: ColumnLayoutSegment,
  widgetId: WidgetId,
  activeContainer: { bucket: LayoutBucket },
  overContainer: { bucket: LayoutBucket },
  overId: string,
  placement: InsertPlacement = 'before',
): ColumnLayoutSegment {
  const segmentIndex = 0;
  const segments = editorColumnsToSegments(columns);
  const nextSegments = moveWidgetInLayout(
    segments,
    widgetId,
    { segmentIndex, bucket: activeContainer.bucket },
    { segmentIndex, bucket: overContainer.bucket },
    overId,
    placement,
  );
  const segment = getColumnSegment(nextSegments, 0);
  return segment ?? columns;
}

export function buildEditorDisplayRows(
  widgets: DashboardWidget[],
  options?: { includeHidden?: boolean },
): Array<{ type: 'full'; widget: DashboardWidget } | { type: 'columns' }> {
  const list = options?.includeHidden ? (widgets ?? []) : (widgets ?? []).filter(widget => widget.visible);
  const rows: Array<{ type: 'full'; widget: DashboardWidget } | { type: 'columns' }> = [];
  let columnsAdded = false;

  for (const widget of list) {
    if (widget.cols === 12) {
      rows.push({ type: 'full', widget });
    } else if (!columnsAdded) {
      rows.push({ type: 'columns' });
      columnsAdded = true;
    }
  }

  if (!columnsAdded) rows.push({ type: 'columns' });
  return rows;
}

export function findContainerInEditor(
  id: string,
  columns: ColumnLayoutSegment,
): { segmentIndex: number; bucket: LayoutBucket } | null {
  return findContainer(id, editorColumnsToSegments(columns));
}

function reorderWidgetInBucket(
  list: DashboardWidget[],
  widgetId: WidgetId,
  overId: string,
  placement: InsertPlacement,
): DashboardWidget[] {
  const activeIndex = list.findIndex(widget => widget.id === widgetId);
  if (activeIndex < 0) return list;

  if (placement === 'end' || isColumnDropTarget(overId)) {
    const lastIndex = list.length - 1;
    if (activeIndex === lastIndex) return list;
    return arrayMoveWidgets(list, activeIndex, lastIndex);
  }

  const overIndex = list.findIndex(widget => widget.id === overId);
  if (overIndex < 0) return list;

  let targetIndex = placement === 'after' ? overIndex + 1 : overIndex;
  if (activeIndex < targetIndex) targetIndex -= 1;
  if (activeIndex === targetIndex) return list;
  return arrayMoveWidgets(list, activeIndex, targetIndex);
}

export function moveWidgetInLayout(
  segments: DashboardLayoutSegment[],
  widgetId: WidgetId,
  activeContainer: { segmentIndex: number; bucket: LayoutBucket },
  overContainer: { segmentIndex: number; bucket: LayoutBucket },
  overId: string,
  placement: InsertPlacement = 'before',
): DashboardLayoutSegment[] {
  const next = cloneLayoutSegments(segments);
  const fromSegment = getColumnSegment(next, activeContainer.segmentIndex);
  const toSegment = getColumnSegment(next, overContainer.segmentIndex);
  if (!fromSegment || !toSegment) return segments;

  const fromList = fromSegment[activeContainer.bucket];
  const activeIndex = fromList.findIndex(widget => widget.id === widgetId);
  if (activeIndex < 0) return segments;

  if (
    activeContainer.segmentIndex === overContainer.segmentIndex &&
    activeContainer.bucket === overContainer.bucket
  ) {
    if (widgetId === overId) return segments;
    fromSegment[activeContainer.bucket] = reorderWidgetInBucket(fromList, widgetId, overId, placement);
    return next;
  }

  const [widget] = fromList.splice(activeIndex, 1);
  widget.colStart = colStartForBucket(overContainer.bucket, widget.cols);

  const toList = toSegment[overContainer.bucket];
  let insertIndex = toList.length;

  if (placement !== 'end' && !isColumnDropTarget(overId)) {
    const overIndex = toList.findIndex(item => item.id === overId);
    if (overIndex >= 0) {
      insertIndex = placement === 'after' ? overIndex + 1 : overIndex;
    }
  }

  toList.splice(insertIndex, 0, widget);
  return next;
}

export function moveFullWidthWidget(
  segments: DashboardLayoutSegment[],
  activeId: WidgetId,
  overId: WidgetId,
): DashboardLayoutSegment[] | null {
  const activeIndex = segments.findIndex(segment => segment.type === 'full' && segment.widget.id === activeId);
  const overIndex = segments.findIndex(segment => segment.type === 'full' && segment.widget.id === overId);
  if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) return null;
  return arrayMoveWidgets(segments, activeIndex, overIndex);
}
