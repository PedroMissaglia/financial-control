'use client';

import { Pencil, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EntityListRowProps {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  badge?: ReactNode;
  titleClassName?: string;
  editLabel: string;
  deleteLabel: string;
  disabled?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export function EntityListRow({
  title,
  subtitle,
  leading,
  badge,
  titleClassName,
  editLabel,
  deleteLabel,
  disabled,
  onEdit,
  onDelete,
}: Readonly<EntityListRowProps>) {
  return (
    <div className="flex w-full flex-nowrap items-center gap-2">
      {leading}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-1.5">
          <p className={cn('min-w-0 truncate font-medium', titleClassName)}>{title}</p>
          {badge}
        </div>
        {subtitle ? <p className="text-muted-foreground truncate text-xs">{subtitle}</p> : null}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0"
        aria-label={editLabel}
        disabled={disabled}
        onClick={onEdit}
      >
        <Pencil className="h-4 w-4" aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-destructive shrink-0"
        aria-label={deleteLabel}
        disabled={disabled}
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
