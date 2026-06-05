import Link from 'next/link';

import { TransacaoCard } from '@/components/transacao-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transacao } from '@/data/transacoes';

interface ExtratoRecenteProps {
  transacoes: Transacao[];
}

export function ExtratoRecente({ transacoes }: ExtratoRecenteProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Extrato recente</CardTitle>
          <CardDescription>Últimas movimentações da sua conta</CardDescription>
        </div>
        <Link href="/transacoes">
          <Button variant="outline" size="sm">
            Ver todas
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {transacoes.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma transação registrada.</p>
        ) : (
          transacoes.map(transacao => (
            <TransacaoCard key={transacao.id} {...transacao} compact />
          ))
        )}
      </CardContent>
    </Card>
  );
}
