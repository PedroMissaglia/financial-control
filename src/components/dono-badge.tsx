'use client';

import { Badge } from '@/components/ui/badge';
import { useEscopoFinanceiro } from '@/lib/use-escopo-financeiro';

export function DonoBadge({ usuarioId }: Readonly<{ usuarioId?: string | null }>) {
  const { visao, donoLabels } = useEscopoFinanceiro();
  if (visao !== 'conjunto' || !usuarioId) return null;
  const label = donoLabels[usuarioId];
  if (!label) return null;

  return (
    <Badge
      variant="default"
      className="shrink-0 font-medium dark:bg-primary/18 dark:text-primary"
    >
      {label}
    </Badge>
  );
}
