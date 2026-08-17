'use client';

/**
 * Editor de layout do dashboard com @dnd-kit (padrão "multiple containers").
 * Usa os mesmos segmentos do dashboard (colunas + painéis 12 colunas) para permitir
 * reordenar painéis full-width e posicioná-los abaixo de qualquer outro painel.
 *
 * @see https://docs.dndkit.com/presets/sortable#multiple-containers
 */

import {
  closestCorners,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  pointerWithin,
  PointerSensor,
  type UniqueIdentifier,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Columns2, Eye, EyeOff, GripVertical, Plus, StretchHorizontal, Trash2 } from 'lucide-react';
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { ConfirmarExclusaoGrupoModal } from '@/components/confirmar-exclusao-grupo-modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { DashboardWidget, LayoutGroupDefinition, LayoutRow, WidgetCols, WidgetId } from '../../../shared/dashboard-contract';
import {
  appendContainerId,
  canRemoveLayoutGroup,
  cloneLayoutSegments,
  containerId,
  fullWidgetAppendId,
  getRemoveLayoutGroupTarget,
  insertEmptyLayoutGroup,
  isColumnDropTarget,
  layoutAppendId,
  layoutPayloadFromSegments,
  moveWidgetInSegments,
  parseContainerId,
  parseSegmentGroupAppendId,
  removeLayoutGroup,
  resolveDashboardLayout,
  segmentGroupAppendId,
  segmentsLayoutSignature,
  segmentUsesThreeColumns,
  updateSegmentGroupName,
  type ColumnLayoutSegment,
  type DashboardLayoutSegment,
  type InsertPlacement,
} from '@/lib/dashboard-layout';
import { cn } from '@/lib/utils';

const PANEL_SIZE_OPTIONS: { cols: WidgetCols; icon: typeof Columns2; label: string }[] = [
  { cols: 6, icon: Columns2, label: 'Painel pequeno (metade da largura)' },
  { cols: 12, icon: StretchHorizontal, label: 'Painel grande (largura total)' },
];

interface SortableWidgetProps {
  widget: DashboardWidget;
  label: string;
  onToggleVisibility: () => void;
  onSetCols: (cols: WidgetCols) => void;
  children: ReactNode;
}

function SortableWidget({
  widget,
  label,
  onToggleVisibility,
  onSetCols,
  children,
}: Readonly<SortableWidgetProps>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
  });

  const style = isDragging
    ? { opacity: 0 }
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('min-w-0', !widget.visible && 'rounded-xl border border-dashed opacity-55')}
    >
      <div className="bg-card/80 mb-2 flex flex-col gap-2 rounded-lg border px-2 py-1 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          className="text-muted-foreground flex min-w-0 flex-1 cursor-grab items-center gap-1 text-xs active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate">{label}</span>
        </button>
        <div className="flex shrink-0 flex-wrap items-center gap-1">
          {PANEL_SIZE_OPTIONS.map(option => {
            const Icon = option.icon;
            return (
              <Button
                key={option.cols}
                type="button"
                variant={widget.cols === option.cols ? 'secondary' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                aria-label={`${option.label}: ${label}`}
                aria-pressed={widget.cols === option.cols}
                onClick={() => onSetCols(option.cols)}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </Button>
            );
          })}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label={`${widget.visible ? 'Ocultar' : 'Mostrar'} painel: ${label}`}
            onClick={onToggleVisibility}
          >
            {widget.visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <div className="pointer-events-none overflow-hidden select-none">{children}</div>
    </div>
  );
}

function AppendDropZone({ id, ariaLabel }: Readonly<{ id: string; ariaLabel: string }>) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: 'append', containerId: id } });

  return (
    <div
      ref={setNodeRef}
      aria-label={ariaLabel}
      className={cn('h-px w-full shrink-0', isOver && 'bg-primary/25')}
    />
  );
}

interface DroppableColumnProps {
  id: string;
  appendId: string;
  widgets: DashboardWidget[];
  renderWidget: (widget: DashboardWidget) => ReactNode;
}

function DroppableColumn({ id, appendId, widgets, renderWidget }: Readonly<DroppableColumnProps>) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: 'column', containerId: id } });
  const list = widgets ?? [];
  const sortableIds = list.map(widget => widget.id);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-[8rem] min-w-0 flex-col gap-4 rounded-lg border border-dashed border-border/80 p-2 transition-colors sm:min-h-[12rem] sm:gap-6 sm:p-3',
        isOver && 'border-primary bg-primary/5 ring-primary/40 ring-2',
      )}
    >
      <SortableContext id={id} items={sortableIds} strategy={verticalListSortingStrategy}>
        {list.length === 0 ? (
          <div className="text-muted-foreground pointer-events-none flex min-h-[6rem] flex-1 items-center justify-center text-center text-xs">
            Arraste um painel para cá
          </div>
        ) : (
          list.map(widget => <div key={widget.id}>{renderWidget(widget)}</div>)
        )}
        <AppendDropZone id={appendId} ariaLabel="Posicionar painel abaixo nesta coluna" />
      </SortableContext>
    </div>
  );
}

function ColumnGroupContainer({
  segmentIndex,
  groupId,
  name,
  panelCount,
  canDelete,
  onNameCommit,
  onDeleteRequest,
  children,
}: Readonly<{
  segmentIndex: number;
  groupId: string;
  name: string;
  panelCount: number;
  canDelete: boolean;
  onNameCommit: (groupId: string, name: string) => void;
  onDeleteRequest: (groupId: string, groupName: string) => void;
  children: ReactNode;
}>) {
  const [draftName, setDraftName] = useState(name);

  useEffect(() => {
    setDraftName(name);
  }, [name]);

  return (
    <section
      aria-label={draftName}
      className="border-primary/30 bg-card/50 space-y-3 rounded-xl border-2 border-dashed p-3 sm:space-y-4 sm:p-4"
    >
      <header className="border-border/60 space-y-2 border-b pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor={`group-name-${groupId}`} className="text-muted-foreground text-xs">
              Nome do grupo
            </Label>
            <Input
              id={`group-name-${groupId}`}
              value={draftName}
              onChange={event => setDraftName(event.target.value)}
              onBlur={() => onNameCommit(groupId, draftName)}
              className="h-8 text-sm font-medium"
              placeholder="Nome do grupo de painéis"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive mt-5 h-8 w-8 shrink-0 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
            aria-label={`Excluir grupo ${draftName.trim() || name}`}
            disabled={!canDelete}
            onClick={() => onDeleteRequest(groupId, draftName.trim() || name)}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          {panelCount > 0 ? `${panelCount} painé${panelCount === 1 ? 'l' : 'is'}` : 'Vazio'}
        </p>
      </header>
      {children}
      <AppendDropZone
        id={segmentGroupAppendId(segmentIndex)}
        ariaLabel="Posicionar painel abaixo deste grupo"
      />
    </section>
  );
}

function ColumnAreaEditor({
  segmentIndex,
  columns,
  renderWidget,
}: Readonly<{
  segmentIndex: number;
  columns: ColumnLayoutSegment;
  renderWidget: (widget: DashboardWidget) => ReactNode;
}>) {
  const threeColumns = segmentUsesThreeColumns(columns);

  if (threeColumns) {
    return (
      <div className="grid grid-cols-12 gap-4 sm:gap-6">
        <div className="col-span-12 lg:col-span-4">
          <DroppableColumn
            id={containerId(segmentIndex, 'left')}
            appendId={appendContainerId(segmentIndex, 'left')}
            widgets={columns.left}
            renderWidget={renderWidget}
          />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <DroppableColumn
            id={containerId(segmentIndex, 'center')}
            appendId={appendContainerId(segmentIndex, 'center')}
            widgets={columns.center}
            renderWidget={renderWidget}
          />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <DroppableColumn
            id={containerId(segmentIndex, 'right')}
            appendId={appendContainerId(segmentIndex, 'right')}
            widgets={columns.right}
            renderWidget={renderWidget}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-4 sm:gap-6">
      <div className="col-span-12 lg:col-span-6">
        <DroppableColumn
          id={containerId(segmentIndex, 'left')}
          appendId={appendContainerId(segmentIndex, 'left')}
          widgets={columns.left}
          renderWidget={renderWidget}
        />
      </div>
      <div className="col-span-12 lg:col-span-6">
        <DroppableColumn
          id={containerId(segmentIndex, 'right')}
          appendId={appendContainerId(segmentIndex, 'right')}
          widgets={columns.right}
          renderWidget={renderWidget}
        />
      </div>
    </div>
  );
}

function collisionDetection(args: Parameters<typeof pointerWithin>[0]) {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    const appendHit = pointerCollisions.find(collision => {
      const id = String(collision.id);
      return id.endsWith('-append') || id === layoutAppendId();
    });
    if (appendHit) return [appendHit];

    const widgetHit = pointerCollisions.find(collision => !String(collision.id).startsWith('segment-'));
    if (widgetHit) return [widgetHit];

    const columnHit = pointerCollisions.find(collision => parseContainerId(String(collision.id)));
    if (columnHit) return [columnHit];

    return pointerCollisions;
  }
  return closestCorners(args);
}

function getInsertPlacement(event: DragEndEvent, overId: string): InsertPlacement {
  if (
    isColumnDropTarget(overId) ||
    overId === layoutAppendId() ||
    overId.endsWith('-append') ||
    parseSegmentGroupAppendId(overId)
  ) {
    return 'end';
  }

  const activeRect = event.active.rect.current.translated;
  const overRect = event.over?.rect;
  if (!activeRect || !overRect) return 'before';

  const activeCenterY = activeRect.top + activeRect.height / 2;
  const overMiddleY = overRect.top + overRect.height / 2;
  return activeCenterY > overMiddleY ? 'after' : 'before';
}

interface DashboardLayoutEditorProps {
  widgets: DashboardWidget[];
  layoutRows: LayoutRow[];
  layoutGroups: LayoutGroupDefinition[];
  widgetLabels: Record<WidgetId, string>;
  onLayoutChange: (payload: {
    widgets: DashboardWidget[];
    layoutRows: LayoutRow[];
    layoutGroups: LayoutGroupDefinition[];
  }) => void;
  renderSortableWidget: (
    widget: DashboardWidget,
    options: {
      onToggleVisibility: () => void;
      onSetCols: (cols: WidgetCols) => void;
    },
  ) => ReactNode;
  onToggleVisibility: (id: WidgetId) => void;
  onSetCols: (id: WidgetId, cols: WidgetCols) => void;
}

export function DashboardLayoutEditor({
  widgets,
  layoutRows,
  layoutGroups,
  widgetLabels,
  onLayoutChange,
  renderSortableWidget,
  onToggleVisibility,
  onSetCols,
}: Readonly<DashboardLayoutEditorProps>) {
  const segmentsFromStore = useMemo(
    () => resolveDashboardLayout(widgets ?? [], layoutRows ?? [], layoutGroups ?? [], { includeHidden: true }),
    [widgets, layoutRows, layoutGroups],
  );
  const layoutSignature = useMemo(
    () => segmentsLayoutSignature(segmentsFromStore),
    [segmentsFromStore],
  );
  const [segments, setSegments] = useState(segmentsFromStore);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [deleteGroupRequest, setDeleteGroupRequest] = useState<{
    groupId: string;
    groupName: string;
    deleteTarget: 'above' | 'below' | null;
  } | null>(null);
  const segmentsRef = useRef(segmentsFromStore);
  const storeSignatureRef = useRef(layoutSignature);
  const isDraggingRef = useRef(false);
  const dragStartSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    if (isDraggingRef.current) return;
    if (storeSignatureRef.current === layoutSignature) return;
    storeSignatureRef.current = layoutSignature;
    setSegments(segmentsFromStore);
    segmentsRef.current = segmentsFromStore;
  }, [layoutSignature, segmentsFromStore]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const activeWidget = activeId ? widgets.find(widget => widget.id === activeId) : null;
  const ActiveSizeIcon = activeWidget?.cols === 12 ? StretchHorizontal : Columns2;

  function commitSegments(nextSegments: DashboardLayoutSegment[]) {
    segmentsRef.current = nextSegments;
    setSegments(nextSegments);
    const payload = layoutPayloadFromSegments(nextSegments);
    storeSignatureRef.current = segmentsLayoutSignature(nextSegments);
    onLayoutChange(payload);
  }

  function handleGroupNameCommit(groupId: string, name: string) {
    const next = updateSegmentGroupName(segmentsRef.current, groupId, name);
    if (next === segmentsRef.current) return;
    commitSegments(next);
  }

  function handleInsertGroup() {
    commitSegments(insertEmptyLayoutGroup(segmentsRef.current, segmentsRef.current.length));
  }

  function handleDeleteGroupRequest(groupId: string, groupName: string) {
    setDeleteGroupRequest({
      groupId,
      groupName,
      deleteTarget: getRemoveLayoutGroupTarget(segmentsRef.current, groupId),
    });
  }

  function handleConfirmDeleteGroup() {
    if (!deleteGroupRequest) return;
    handleDeleteGroup(deleteGroupRequest.groupId);
    setDeleteGroupRequest(null);
  }

  function handleDeleteGroup(groupId: string) {
    const next = removeLayoutGroup(segmentsRef.current, groupId);
    if (!next) return;
    commitSegments(next);
  }

  function applyDrag(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const overId = String(over.id);
    const widgetId = active.id as WidgetId;

    const next = moveWidgetInSegments(
      segmentsRef.current,
      widgetId,
      overId,
      getInsertPlacement(event, overId),
    );

    if (segmentsLayoutSignature(next) === segmentsLayoutSignature(segmentsRef.current)) return;
    segmentsRef.current = next;
    setSegments(next);
  }

  function handleDragStart(event: DragStartEvent) {
    isDraggingRef.current = true;
    dragStartSignatureRef.current = segmentsLayoutSignature(segmentsRef.current);
    setActiveId(event.active.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    applyDrag(event);
    const nextSignature = segmentsLayoutSignature(segmentsRef.current);
    if (nextSignature !== dragStartSignatureRef.current) {
      commitSegments(segmentsRef.current);
    }
    isDraggingRef.current = false;
    dragStartSignatureRef.current = null;
    setActiveId(null);
  }

  function handleDragCancel() {
    const reset = cloneLayoutSegments(segmentsFromStore);
    segmentsRef.current = reset;
    setSegments(reset);
    storeSignatureRef.current = layoutSignature;
    isDraggingRef.current = false;
    setActiveId(null);
  }

  function renderEditorWidget(widget: DashboardWidget) {
    return renderSortableWidget(widget, {
      onToggleVisibility: () => onToggleVisibility(widget.id),
      onSetCols: cols => onSetCols(widget.id, cols),
    });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="space-y-3">
        <Button type="button" variant="outline" size="sm" className="gap-2" onClick={handleInsertGroup}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Inserir grupo de colunas
        </Button>

        <div className="border-primary/35 bg-accent/35 space-y-4 rounded-xl border-2 border-dashed p-2 sm:space-y-6 sm:p-3">
          {segments.map((segment, segmentIndex) => {
            if (segment.type === 'full') {
              return (
                <SortableContext key={segment.widget.id} items={[segment.widget.id]} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {renderEditorWidget(segment.widget)}
                    <AppendDropZone
                      id={fullWidgetAppendId(segment.widget.id)}
                      ariaLabel="Posicionar painel abaixo deste painel"
                    />
                  </div>
                </SortableContext>
              );
            }

            return (
              <ColumnGroupContainer
                key={segment.groupId}
                segmentIndex={segmentIndex}
                groupId={segment.groupId}
                name={segment.name}
                panelCount={segment.left.length + segment.center.length + segment.right.length}
                canDelete={canRemoveLayoutGroup(segmentsRef.current, segment.groupId)}
                onNameCommit={handleGroupNameCommit}
                onDeleteRequest={handleDeleteGroupRequest}
              >
                <ColumnAreaEditor
                  segmentIndex={segmentIndex}
                  columns={segment}
                  renderWidget={renderEditorWidget}
                />
              </ColumnGroupContainer>
            );
          })}
          <AppendDropZone id={layoutAppendId()} ariaLabel="Posicionar painel no final do layout" />
        </div>
      </div>
      <ConfirmarExclusaoGrupoModal
        open={!!deleteGroupRequest}
        groupName={deleteGroupRequest?.groupName ?? ''}
        deleteTarget={deleteGroupRequest?.deleteTarget ?? null}
        onConfirm={handleConfirmDeleteGroup}
        onClose={() => setDeleteGroupRequest(null)}
      />
      <DragOverlay dropAnimation={null}>
        {activeWidget ? (
          <div className="bg-card flex min-w-[12rem] items-center gap-2 rounded-lg border px-3 py-2 text-sm shadow-lg">
            <ActiveSizeIcon className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="font-medium">{widgetLabels[activeWidget.id]}</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export { SortableWidget };
