'use client';

import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { cn, formatDateShort } from '@/lib/utils';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'] as const;

const MONTH_FORMATTER = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function isBeforeIso(value: string, max: string): boolean {
  return value < max;
}

function isAfterIso(value: string, min: string): boolean {
  return value > min;
}

interface DatePickerProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  align?: 'start' | 'end';
  'aria-label'?: string;
}

export function DatePicker({
  id,
  value,
  onChange,
  min,
  max,
  placeholder = 'dd/mm/aaaa',
  align = 'start',
  'aria-label': ariaLabel,
}: Readonly<DatePickerProps>) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const dialogId = `${triggerId}-calendar`;
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selected = parseIsoDate(value);
  const today = new Date();
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(selected ?? today));

  useEffect(() => {
    if (!open) return;
    setVisibleMonth(startOfMonth(parseIsoDate(value) ?? new Date()));
  }, [open, value]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const days = useMemo(() => {
    const first = startOfMonth(visibleMonth);
    const startOffset = first.getDay();
    const gridStart = new Date(first);
    gridStart.setDate(first.getDate() - startOffset);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      return date;
    });
  }, [visibleMonth]);

  function selectDay(date: Date) {
    const iso = toIsoDate(date);
    if (min && isBeforeIso(iso, min)) return;
    if (max && isAfterIso(iso, max)) return;
    onChange(iso);
    setOpen(false);
  }

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        type="button"
        id={triggerId}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        aria-label={ariaLabel}
        className="border-input bg-background text-foreground focus-visible:ring-ring flex h-10 w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        onClick={() => setOpen(current => !current)}
      >
        <span className={cn('truncate text-left', !selected && 'text-muted-foreground')}>
          {selected ? formatDateShort(value) : placeholder}
        </span>
        <Calendar className="text-muted-foreground h-4 w-4 shrink-0" aria-hidden="true" />
      </button>

      {open && (
        <div
          id={dialogId}
          aria-label="Calendário"
          className={cn(
            'border-border bg-popover text-popover-foreground absolute z-[100] mt-1 w-[min(18.5rem,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] rounded-md border p-3 shadow-md',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              className="hover:bg-accent hover:text-accent-foreground inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors"
              aria-label="Mês anterior"
              onClick={() => setVisibleMonth(current => addMonths(current, -1))}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <p className="text-sm font-medium capitalize">{MONTH_FORMATTER.format(visibleMonth)}</p>
            <button
              type="button"
              className="hover:bg-accent hover:text-accent-foreground inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors"
              aria-label="Próximo mês"
              onClick={() => setVisibleMonth(current => addMonths(current, 1))}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="text-muted-foreground mb-1 grid grid-cols-7 text-center text-xs font-medium">
            {WEEKDAYS.map((day, index) => (
              <span key={`${day}-${index}`} className="py-1">
                {day}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {days.map(date => {
              const iso = toIsoDate(date);
              const inMonth = date.getMonth() === visibleMonth.getMonth();
              const selectedDay = selected ? isSameDay(date, selected) : false;
              const isToday = isSameDay(date, today);
              const disabled = Boolean((min && isBeforeIso(iso, min)) || (max && isAfterIso(iso, max)));

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  aria-pressed={selectedDay}
                  aria-label={formatDateShort(iso)}
                  className={cn(
                    'h-8 rounded-md text-sm transition-colors',
                    inMonth ? 'text-foreground' : 'text-muted-foreground/50',
                    !selectedDay && !disabled && 'hover:bg-accent hover:text-accent-foreground',
                    selectedDay && 'bg-primary text-primary-foreground hover:bg-primary',
                    isToday && !selectedDay && 'ring-ring ring-1 ring-inset',
                    disabled && 'cursor-not-allowed opacity-40',
                  )}
                  onClick={() => selectDay(date)}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
