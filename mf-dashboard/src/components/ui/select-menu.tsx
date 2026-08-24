import { ChevronDown } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

export interface SelectMenuOption {
  value: string;
  label: string;
}

interface SelectMenuProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly SelectMenuOption[];
  className?: string;
  'aria-label'?: string;
}

export function SelectMenu({
  id,
  value,
  onChange,
  options,
  className,
  'aria-label': ariaLabel,
}: Readonly<SelectMenuProps>) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const listboxId = `${triggerId}-listbox`;
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find(option => option.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
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

  return (
    <div ref={rootRef} className={cn('relative w-full', className)}>
      <button
        type="button"
        id={triggerId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-label={ariaLabel}
        className="border-input bg-background text-foreground focus-visible:ring-ring flex h-10 w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        onClick={() => setOpen(current => !current)}
      >
        <span className="truncate text-left">{selected?.label}</span>
        <ChevronDown
          className={cn('text-muted-foreground h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-labelledby={triggerId}
          className="border-border bg-popover text-popover-foreground absolute z-[100] mt-1 max-h-60 w-full overflow-auto rounded-md border py-1 shadow-md"
        >
          {options.map(option => (
            <li key={option.value || '__empty'} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={value === option.value}
                className={cn(
                  'hover:bg-accent hover:text-accent-foreground flex w-full px-3 py-2 text-left text-sm transition-colors',
                  value === option.value && 'bg-accent text-accent-foreground font-medium',
                )}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
