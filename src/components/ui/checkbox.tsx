import { Check } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  tone?: 'default' | 'danger';
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, tone = 'default', disabled, ...props }, ref) => {
    return (
      <label
        className={cn(
          'relative inline-flex h-10 w-10 shrink-0 items-center justify-center',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer'
        )}
      >
        <input ref={ref} type="checkbox" className="peer sr-only" disabled={disabled} {...props} />
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none flex h-5 w-5 items-center justify-center rounded-md border shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-150',
            'bg-background border-input',
            'peer-enabled:peer-hover:border-primary/55 peer-enabled:peer-hover:bg-accent',
            'peer-focus-visible:ring-ring peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2',
            'peer-checked:border-primary peer-checked:bg-primary peer-checked:shadow-none peer-checked:peer-enabled:peer-hover:border-primary peer-checked:peer-enabled:peer-hover:bg-primary/90',
            'peer-disabled:opacity-50',
            'peer-active:scale-95',
            tone === 'danger' &&
              'border-destructive/45 bg-destructive/[0.06] peer-enabled:peer-hover:border-destructive/70 peer-enabled:peer-hover:bg-destructive/10',
            '[&>svg]:scale-75 [&>svg]:opacity-0 peer-checked:[&>svg]:scale-100 peer-checked:[&>svg]:opacity-100',
            className
          )}
        >
          <Check className="text-primary-foreground h-3.5 w-3.5 transition-all duration-150" strokeWidth={3} />
        </span>
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
