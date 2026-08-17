import type { ReactNode } from 'react';

import type { DashboardWidget, LayoutGroupDefinition, LayoutRow } from '../../../shared/dashboard-contract';
import {
  resolveDashboardLayout,
  segmentUsesThreeColumns,
  type DashboardLayoutSegment,
} from '@/lib/dashboard-layout';
import { cn } from '@/lib/utils';

interface DashboardWidgetGridProps {
  widgets: DashboardWidget[];
  layoutRows?: LayoutRow[];
  layoutGroups?: LayoutGroupDefinition[];
  includeHidden?: boolean;
  className?: string;
  segmentClassName?: string;
  renderWidget: (widget: DashboardWidget) => ReactNode;
}

function ColumnStack({
  widgets,
  className,
  renderWidget,
}: Readonly<{
  widgets: DashboardWidget[];
  className?: string;
  renderWidget: (widget: DashboardWidget) => ReactNode;
}>) {
  if (widgets.length === 0) return null;

  return (
    <div className={cn('flex min-w-0 flex-col gap-4 sm:gap-6', className)}>
      {widgets.map(widget => (
        <div key={widget.id} className="min-w-0">
          {renderWidget(widget)}
        </div>
      ))}
    </div>
  );
}

function ColumnSegment({
  segment,
  segmentClassName,
  renderWidget,
}: Readonly<{
  segment: Extract<DashboardLayoutSegment, { type: 'columns' }>;
  segmentClassName?: string;
  renderWidget: (widget: DashboardWidget) => ReactNode;
}>) {
  const grid = segmentUsesThreeColumns(segment) ? (
    <div className={cn('grid grid-cols-12 gap-4 sm:gap-6', segmentClassName)}>
      <ColumnStack widgets={segment.left} className="col-span-12 lg:col-span-4" renderWidget={renderWidget} />
      <ColumnStack widgets={segment.center} className="col-span-12 lg:col-span-4" renderWidget={renderWidget} />
      <ColumnStack widgets={segment.right} className="col-span-12 lg:col-span-4" renderWidget={renderWidget} />
    </div>
  ) : (
    <div className={cn('grid grid-cols-12 gap-4 sm:gap-6', segmentClassName)}>
      <ColumnStack widgets={segment.left} className="col-span-12 lg:col-span-6" renderWidget={renderWidget} />
      <ColumnStack widgets={segment.right} className="col-span-12 lg:col-span-6" renderWidget={renderWidget} />
    </div>
  );

  return (
    <section aria-label={segment.name} className="space-y-3">
      <h2 className="text-muted-foreground text-sm font-medium">{segment.name}</h2>
      {grid}
    </section>
  );
}

export function DashboardWidgetGrid({
  widgets,
  layoutRows,
  layoutGroups,
  includeHidden = false,
  className,
  segmentClassName,
  renderWidget,
}: Readonly<DashboardWidgetGridProps>) {
  const segments = resolveDashboardLayout(widgets ?? [], layoutRows ?? [], layoutGroups ?? [], { includeHidden });

  return (
    <div className={cn('space-y-4 sm:space-y-6', className)}>
      {segments.map((segment, index) => {
        if (segment.type === 'full') {
          return (
            <div key={segment.widget.id} className={cn('min-w-0', segmentClassName)}>
              {renderWidget(segment.widget)}
            </div>
          );
        }

        return (
          <ColumnSegment
            key={segment.groupId}
            segment={segment}
            segmentClassName={segmentClassName}
            renderWidget={renderWidget}
          />
        );
      })}
    </div>
  );
}
