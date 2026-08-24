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
  pago: 'bg-status-pago',
  aberto: 'bg-status-aberto',
  atrasado: 'bg-status-atrasado',
};

const VALUE_TONE: Record<LinhaCompromisso['situacao'], string> = {
  pago: 'text-status-pago',
  aberto: 'text-status-aberto',
  atrasado: 'text-status-atrasado',
};

type StatTone = 'pago' | 'aberto' | 'atrasado';

const STAT_TONE: Record<StatTone, { box: string; iconWrap: string; value: string; badge: string }> = {
  pago: {
    box: 'border-status-pago/40 bg-status-pago/20 dark:border-status-pago/25 dark:bg-status-pago/12',
    iconWrap: 'bg-status-pago/30 text-status-pago dark:bg-status-pago/16',
    value: 'text-status-pago',
    badge: 'bg-status-pago/30 text-status-pago dark:bg-status-pago/16',
  },
  aberto: {
    box: 'border-status-aberto/40 bg-status-aberto/20 dark:border-status-aberto/25 dark:bg-status-aberto/12',
    iconWrap: 'bg-status-aberto/30 text-status-aberto dark:bg-status-aberto/16',
    value: 'text-status-aberto',
    badge: 'bg-status-aberto/30 text-status-aberto dark:bg-status-aberto/16',
  },
  atrasado: {
    box: 'border-status-atrasado/45 bg-status-atrasado/20 dark:border-status-atrasado/28 dark:bg-status-atrasado/12',
    iconWrap: 'bg-status-atrasado/30 text-status-atrasado dark:bg-status-atrasado/16',
    value: 'text-status-atrasado',
    badge: 'bg-status-atrasado/30 text-status-atrasado dark:bg-status-atrasado/16',
  },
};

const STAT_ICON: Record<StatTone, LucideIcon> = {
  pago: CircleCheck,
  aberto: Clock,
  atrasado: CircleAlert,
};

interface GastosMensaisPainelProps {
  compromissos: ResumoCompromissos;
  porPessoa?: { usuarioId: string; nome: string; compromissosTotal: number }[];
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
  const formatted = formatCurrency(valor);

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-2 rounded-xl border px-3 py-3',
        classes.box,
        vazio && 'opacity-70',
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', classes.iconWrap)}
          aria-hidden="true"
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
          <p className="text-muted-foreground text-[11px] font-normal tracking-wide">{label}</p>
          <span
            className={cn(
              'inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-medium tabular-nums',
              classes.badge,
            )}
          >
            {quantidade}
          </span>
        </div>
      </div>
      <div className="group/stat relative min-w-0">
        <p
          className={cn(
            'w-full truncate text-lg font-bold tracking-tight tabular-nums sm:text-xl',
            classes.value,
          )}
        >
          {formatted}
        </p>
        <div
          role="tooltip"
          className="border-border bg-popover text-popover-foreground pointer-events-none absolute top-full left-0 z-20 mt-1.5 hidden max-w-[min(18rem,calc(100vw-2rem))] rounded-lg border px-3 py-1.5 text-sm whitespace-nowrap shadow-sm group-hover/stat:block"
        >
          {label} : {formatted}
        </div>
      </div>
    </div>
  );
}

export function GastosMensaisPainel({
  compromissos,
  porPessoa = [],
}: Readonly<GastosMensaisPainelProps>) {
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
        {porPessoa.length > 0 && (
          <ul className="text-muted-foreground space-y-1 text-sm">
            {porPessoa.map(pessoa => (
              <li key={pessoa.usuarioId} className="flex justify-between gap-2">
                <span>Compromissos de {pessoa.nome}</span>
                <span className="text-foreground font-medium">{formatCurrency(pessoa.compromissosTotal)}</span>
              </li>
            ))}
          </ul>
        )}
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
