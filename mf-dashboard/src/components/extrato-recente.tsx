import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getUltimasTransacoes, isEntrada, type Transacao } from '@/data/transacoes';
import { cn, formatCurrency, formatDateShort } from '@/lib/utils';

const MF_NAVIGATE = 'fincontrol:navigate';

interface ExtratoRecenteProps {
  transacoes: Transacao[];
  limit: number;
  donoLabels?: Record<string, string>;
  periodo: string;
}

export function ExtratoRecente({ transacoes, limit, donoLabels, periodo }: Readonly<ExtratoRecenteProps>) {
  const recentes = getUltimasTransacoes(transacoes, limit);
  const showDono = Boolean(donoLabels && Object.keys(donoLabels).length > 1);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <CardTitle>Extrato recente · {periodo}</CardTitle>
          <CardDescription>Últimas movimentações de {periodo}</CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full shrink-0 sm:w-auto"
          onClick={() => window.dispatchEvent(new CustomEvent(MF_NAVIGATE, { detail: { href: '/transacoes' } }))}
        >
          Ver todas
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentes.length === 0 ? (
          <p className="text-muted-foreground fc-caption text-sm">Nenhuma transação neste mês.</p>
        ) : (
          recentes.map(transacao => {
            const entrada = isEntrada(transacao.tipo);
            const dono = showDono ? donoLabels?.[transacao.usuarioId] : undefined;
            return (
              <div
                key={transacao.id}
                className="border-border/60 flex items-center gap-3 rounded-lg border px-3 py-2"
              >
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                    entrada
                      ? 'bg-primary/25 text-primary dark:bg-primary/14'
                      : 'bg-status-atrasado/25 text-status-atrasado dark:bg-status-atrasado/14',
                  )}
                  aria-hidden="true"
                >
                  {entrada ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                    <p className="truncate text-sm font-medium">{transacao.descricao}</p>
                    {dono && (
                      <span className="border-border text-muted-foreground shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold">
                        {dono}
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {formatDateShort(transacao.data)}
                    {transacao.hora ? ` · ${transacao.hora.slice(0, 5)}` : ''}
                  </p>
                </div>
                <p
                  className={cn(
                    'shrink-0 text-sm font-semibold',
                    entrada ? 'text-primary' : 'text-status-atrasado',
                  )}
                >
                  {entrada ? '+' : '-'}
                  {formatCurrency(transacao.valor)}
                </p>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
