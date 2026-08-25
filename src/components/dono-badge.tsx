'use client';

import { useEscopoFinanceiro } from '@/lib/use-escopo-financeiro';

export function DonoBadge({ usuarioId }: Readonly<{ usuarioId?: string | null }>) {
  const { visao, donoLabels } = useEscopoFinanceiro();
  if (visao !== 'conjunto' || !usuarioId) return null;
  const label = donoLabels[usuarioId];
  if (!label) return null;

  return (
    <span className="border-border text-muted-foreground shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold">
      {label}
    </span>
  );
}
