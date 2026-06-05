'use client';

import * as React from 'react';

import { Input, type InputProps } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';

export interface CurrencyInputProps extends Omit<InputProps, 'value' | 'onChange' | 'type'> {
  value?: number;
  onChange?: (value: number) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, ...props }, ref) => {
    const display = value && value > 0 ? formatCurrency(value) : '';

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
      const digits = event.target.value.replace(/\D/g, '');
      const numeric = digits ? Number(digits) / 100 : 0;
      onChange?.(numeric);
    }

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="numeric"
        placeholder="R$ 0,00"
        value={display}
        onChange={handleChange}
        {...props}
      />
    );
  }
);
CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };
