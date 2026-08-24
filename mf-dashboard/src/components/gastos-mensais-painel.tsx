import { CircleAlert, CircleCheck, Clock, type LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  labelGastosMensaisTitulo,
  type LinhaCompromisso,
  type ResumoCompromissos,
} from '@/data/gastos-mensais';
import { cn, formatCurrency } from '@/lib/utils';

const MF_NAVIGATE = 'fincontrol:navigate';

const SITUACAO_LABEL: Record<LinhaCompromisso['situacao'], string> = {
  pago: 'Pago',
  aberto: 'No prazo',
  atrasado: 'Atrasado',
};

const DOT_TONE: Record<LinhaCompromisso['situacao'], string> = {
  pago: 'bg-success',
  aberto: 'bg-primary',
  atrasado: 'bg-destructive',
};

const VALUE_TONE: Record<LinhaCompromisso['situacao'], string> = {
  pago: 'text-success',
  aberto: 'text-primary',
  atrasado: 'text-destructive',
};

type StatTone = 'pago' | 'aberto' | 'atrasado';

const STAT_TONE: Record<StatTone, { box: string; iconWrap: string; value: string; badge: string }> = {
  pago: {
    box: 'border-success/20 bg-success/10',
    iconWrap: 'bg-success/20 text-success',
    value: 'text-success',
    badge: 'bg-success/20 text-success',
  },
  aberto: {
    box: 'border-primary/20 bg-primary/10',
    iconWrap: 'bg-primary/20 text-primary',
    value: 'text-primary',
    badge: 'bg-primary/20 text-primary',
  },
  atrasado: {
    box: 'border-destructive/20 bg-destructive/10',
    iconWrap: 'bg-destructive/20 text-destructive',
    value: 'text-destructive',
    badge: 'bg-destructive/20 text-destructive',
  },
};

const STAT_ICON: Record<StatTone, LucideIcon> = {
  pago: CircleCheck,
  aberto: Clock,
  atrasado: CircleAlert,
};

interface GastosMensaisPainelProps {
  compromissos: ResumoCompromissos;
}

function StatResumo({
  quantidade,
  valor,
  label,
  tone,
}: Readonly<{ quantidade: number; valor: number; label: string; tone: StatTone }>) {
  const Icon = STAT_ICON[tone];
  const classes = STAT_TONE[tone];
  const vazio = quantidade === 0 && valor === 0;

  return (
    <div className={cn('flex min-w-0 items-start gap-3 rounded-xl border px-3 py-3', classes.box, vazio && 'opacity-70')}>
      <div
        className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', classes.iconWrap)}
        aria-hidden="true"
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground text-[11px] font-normal tracking-wide">{label}</p>
          <span
            className={cn(
              'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-medium tabular-nums',
              classes.badge,
            )}
          >
            {quantidade}
          </span>
        </div>
        <p className={cn('mt-0.5 truncate text-lg font-bold tracking-tight tabular-nums sm:text-xl', classes.value)}>
          {formatCurrency(valor)}
        </p>
      </div>
    </div>
  );
}

export function GastosMensaisPainel({ compromissos }: Readonly<GastosMensaisPainelProps>) {
  const vazio = compromissos.linhas.length === 0;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <CardTitle>{labelGastosMensaisTitulo(compromissos.competencia)}</CardTitle>
          <CardDescription>Painel de controle da competência atual.</CardDescription>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full shrink-0 sm:w-auto"
          onClick={() => window.dispatchEvent(new CustomEvent(MF_NAVIGATE, { detail: { href: '/gastos-mensais' } }))}
        >
          Abrir lista
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatResumo
            quantidade={compromissos.pago.quantidade}
            valor={compromissos.pago.valor}
            label="Pagos"
            tone="pago"
          />
          <StatResumo
            quantidade={compromissos.aberto.quantidade}
            valor={compromissos.aberto.valor}
            label="Em aberto"
            tone="aberto"
          />
          <StatResumo
            quantidade={compromissos.atrasado.quantidade}
            valor={compromissos.atrasado.valor}
            label="Atrasados"
            tone="atrasado"
          />
        </div>
        {vazio ? (
          <p className="fc-caption">Nenhum gasto mensal nesta competência.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-sm">
              <caption className="sr-only">{labelGastosMensaisTitulo(compromissos.competencia)}</caption>
              <thead>
                <tr className="text-muted-foreground border-border border-b text-left">
                  <th className="py-2 pr-3 font-medium">Título</th>
                  <th className="px-3 py-2 text-right font-medium">Vence dia</th>
                  <th className="px-3 py-2 text-right font-medium">Valor</th>
                  <th className="py-2 pl-3 font-medium">Situação</th>
                </tr>
              </thead>
              <tbody>
                {compromissos.linhas.map(linha => (
                  <tr key={linha.id} className="border-border/60 border-b last:border-0">
                    <td className="py-2.5 pr-3 font-medium">{linha.titulo}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{linha.diaVencimento}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatCurrency(linha.valor)}</td>
                    <td className="py-2.5 pl-3">
                      <span className={cn('inline-flex items-center gap-2', VALUE_TONE[linha.situacao])}>
                        <span className={cn('h-2 w-2 shrink-0 rounded-full', DOT_TONE[linha.situacao])} aria-hidden="true" />
                        {SITUACAO_LABEL[linha.situacao]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
