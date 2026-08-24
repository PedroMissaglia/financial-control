'use client';

import { Users } from 'lucide-react';

import { type VisaoFinanceira, primeiroNome } from '@/data/conta-conjunta';
import { useEscopoFinanceiro } from '@/lib/use-escopo-financeiro';
import { cn } from '@/lib/utils';

const OPTIONS: { value: VisaoFinanceira; fallback: string }[] = [
  { value: 'eu', fallback: 'Eu' },
  { value: 'parceiro', fallback: 'Cônjuge' },
  { value: 'conjunto', fallback: 'Conjunta' },
];

interface VisaoSwitcherProps {
  className?: string;
  /** Distribui as opções em largura total (mobile). */
  fullWidth?: boolean;
}

export function VisaoSwitcher({ className, fullWidth = false }: Readonly<VisaoSwitcherProps>) {
  const { ativa, visao, setVisao, parceiro } = useEscopoFinanceiro();

  if (!ativa || !parceiro) return null;

  return (
    <fieldset
      aria-label="Visão da conta"
      className={cn(
        'border-border bg-muted/60 m-0 inline-flex min-w-0 items-center rounded-lg border p-0.5',
        fullWidth && 'flex w-full',
        className,
      )}
    >
      <legend className="sr-only">Visão da conta</legend>
      {OPTIONS.map(option => {
        const label = option.value === 'parceiro' ? primeiroNome(parceiro.nome) : option.fallback;
        const selected = visao === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            className={cn(
              'rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
              fullWidth && 'min-w-0 flex-1 justify-center px-1.5 text-xs',
              selected ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setVisao(option.value)}
          >
            {option.value === 'conjunto' ? (
              <span className="inline-flex items-center justify-center gap-1">
                <Users className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">{label}</span>
              </span>
            ) : (
              <span className="truncate">{label}</span>
            )}
          </button>
        );
      })}
    </fieldset>
  );
}
