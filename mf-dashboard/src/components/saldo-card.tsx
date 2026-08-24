import { TrendingUp, Wallet } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardMetric } from '@/components/ui/card';
import type { TotaisPorPessoa } from '@/lib/build-widget-analytics';
import { formatCurrency } from '@/lib/utils';

interface SaldoCardProps {
  saldo: number;
  porPessoa?: TotaisPorPessoa[];
}

export function SaldoCard({ saldo, porPessoa = [] }: SaldoCardProps) {
  const isPositive = saldo >= 0;

  return (
    <Card className="border-primary/20 to-accent bg-gradient-to-br from-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="min-w-0 flex-1 pr-3">
          <CardDescription>Saldo em conta</CardDescription>
          <CardMetric className="truncate">{formatCurrency(saldo)}</CardMetric>
        </div>
        <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-12 sm:w-12">
          <Wallet className="text-primary h-5 w-5 sm:h-6 sm:w-6" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className={`fc-caption flex items-center gap-1 ${isPositive ? 'text-success' : 'text-destructive'}`}>
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
          {isPositive ? 'Saldo positivo' : 'Saldo negativo'}
        </p>
        {porPessoa.length > 0 && (
          <ul className="text-muted-foreground space-y-1 text-sm">
            {porPessoa.map(pessoa => (
              <li key={pessoa.usuarioId} className="flex justify-between gap-2">
                <span>Saldo de {pessoa.nome}</span>
                <span className="text-foreground font-medium">{formatCurrency(pessoa.saldo)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
