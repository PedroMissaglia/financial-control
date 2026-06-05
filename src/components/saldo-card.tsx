import { TrendingUp, Wallet } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

interface SaldoCardProps {
  saldo: number;
}

export function SaldoCard({ saldo }: SaldoCardProps) {
  const isPositive = saldo >= 0;

  return (
    <Card className="border-primary/20 to-accent bg-gradient-to-br from-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardDescription>Saldo em conta</CardDescription>
          <CardTitle className="text-3xl font-bold tracking-tight">{formatCurrency(saldo)}</CardTitle>
        </div>
        <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-full">
          <Wallet className="text-primary h-6 w-6" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent>
        <p className={`flex items-center gap-1 text-sm ${isPositive ? 'text-success' : 'text-destructive'}`}>
          <TrendingUp className="h-4 w-4" aria-hidden="true" />
          {isPositive ? 'Saldo positivo' : 'Saldo negativo'}
        </p>
      </CardContent>
    </Card>
  );
}
