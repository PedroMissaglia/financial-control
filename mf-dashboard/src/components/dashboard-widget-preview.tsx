import { AlertTriangle, PiggyBank } from 'lucide-react';
import { lazy, type ReactNode, Suspense, useEffect, useRef, useState } from 'react';

import { ExtratoRecente } from '@/components/extrato-recente';
import { SaldoCard } from '@/components/saldo-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transacao } from '@/data/transacoes';
import type { DashboardWidgetAnalytics } from '@/lib/build-widget-analytics';
import { cn, formatCurrency } from '@/lib/utils';

import type { WidgetId } from '../../../shared/dashboard-contract';

export type { DashboardWidgetAnalytics };

const EvolucaoSaldoChart = lazy(() =>
  import('@/components/financeiro-charts').then(mod => ({ default: mod.EvolucaoSaldoChart })),
);
const ReceitasDespesasChart = lazy(() =>
  import('@/components/financeiro-charts').then(mod => ({ default: mod.ReceitasDespesasChart })),
);
const GastosCategoriaChart = lazy(() =>
  import('@/components/financeiro-charts').then(mod => ({ default: mod.GastosCategoriaChart })),
);

const CHART_WIDGET_IDS = new Set<WidgetId>(['evolucao', 'comparativo', 'categorias']);

export const WIDGET_LABELS: Record<WidgetId, string> = {
  saldo: 'Saldo',
  evolucao: 'Evolução do saldo',
  comparativo: 'Receitas vs despesas',
  categorias: 'Gastos por categoria',
  extrato: 'Extrato recente',
  meta: 'Meta de economia',
  alerta: 'Alerta de gastos',
};

function Pulse({ className }: Readonly<{ className?: string }>) {
  return <div className={cn('bg-muted animate-pulse rounded', className)} />;
}

function SkeletonStatus({ id, children }: Readonly<{ id: WidgetId; children: ReactNode }>) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">Carregando {WIDGET_LABELS[id]}</span>
      {children}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-card w-full rounded-xl border p-3 shadow-sm sm:p-4">
      <Pulse className="mb-4 h-5 w-40" />
      <Pulse className="h-[220px] rounded-lg sm:h-[280px]" />
    </div>
  );
}

function SaldoSkeleton() {
  return (
    <Card className="border-primary/20 to-accent bg-gradient-to-br from-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="min-w-0 flex-1 space-y-2 pr-3">
          <Pulse className="h-4 w-28" />
          <Pulse className="h-8 w-40" />
        </div>
        <Pulse className="h-10 w-10 shrink-0 rounded-full sm:h-12 sm:w-12" />
      </CardHeader>
      <CardContent>
        <Pulse className="h-4 w-32" />
      </CardContent>
    </Card>
  );
}

function ExtratoSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-2">
          <Pulse className="h-5 w-36" />
          <Pulse className="h-4 w-52 max-w-full" />
        </div>
        <Pulse className="h-9 w-full sm:w-24" />
      </CardHeader>
      <CardContent className="space-y-3">
        {[0, 1, 2].map(index => (
          <div key={index} className="border-border/60 flex items-center gap-3 rounded-lg border px-3 py-2">
            <Pulse className="h-9 w-9 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Pulse className="h-4 w-3/4" />
              <Pulse className="h-3 w-1/3" />
            </div>
            <Pulse className="h-4 w-16 shrink-0" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function MetaSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Pulse className="h-5 w-5" />
          <Pulse className="h-5 w-40" />
        </div>
        <Pulse className="mt-2 h-4 w-64 max-w-full" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Pulse className="h-8 w-36" />
        <Pulse className="h-4 w-28" />
        <Pulse className="h-2 w-full rounded-full" />
        <Pulse className="h-4 w-24" />
      </CardContent>
    </Card>
  );
}

function AlertaSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Pulse className="h-5 w-5" />
          <Pulse className="h-5 w-40" />
        </div>
        <Pulse className="mt-2 h-4 w-56 max-w-full" />
      </CardHeader>
      <CardContent>
        <Pulse className="h-8 w-36" />
        <Pulse className="mt-2 h-4 w-52 max-w-full" />
      </CardContent>
    </Card>
  );
}

function WidgetSkeleton({ id }: Readonly<{ id: WidgetId }>) {
  let body: ReactNode;
  switch (id) {
    case 'saldo':
      body = <SaldoSkeleton />;
      break;
    case 'evolucao':
    case 'comparativo':
    case 'categorias':
      body = <ChartSkeleton />;
      break;
    case 'extrato':
      body = <ExtratoSkeleton />;
      break;
    case 'meta':
      body = <MetaSkeleton />;
      break;
    case 'alerta':
      body = <AlertaSkeleton />;
      break;
  }

  return <SkeletonStatus id={id}>{body}</SkeletonStatus>;
}

/** Defer widget (and recharts chunk) until it is near the viewport. */
function WidgetWhenVisible({
  id,
  lazy = false,
  children,
}: Readonly<{ id: WidgetId; lazy?: boolean; children: ReactNode }>) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const skeleton = <WidgetSkeleton id={id} />;

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;

    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '120px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  let body: ReactNode = skeleton;
  if (visible) {
    body = lazy ? <Suspense fallback={skeleton}>{children}</Suspense> : children;
  }

  return <div ref={ref}>{body}</div>;
}

interface DashboardWidgetPreviewProps {
  id: WidgetId;
  transacoes: Transacao[];
  analytics: DashboardWidgetAnalytics;
  metaEconomia: number;
  alertaGastos: number;
  extratoLimite: number;
  apiUrl?: string;
}

export function DashboardWidgetPreview({
  id,
  transacoes,
  analytics,
  metaEconomia,
  alertaGastos,
  extratoLimite,
}: Readonly<DashboardWidgetPreviewProps>) {
  const { saldo, resumo, evolucao, porCategoria, receitasDespesas } = analytics;
  const economiaAtual = resumo.receitas - resumo.despesas;
  const progressoMeta = metaEconomia > 0 ? Math.min(100, Math.max(0, (economiaAtual / metaEconomia) * 100)) : 0;
  const alertaAtivo = resumo.despesas > alertaGastos;

  let content: ReactNode;
  switch (id) {
    case 'saldo':
      content = <SaldoCard saldo={saldo} />;
      break;
    case 'evolucao':
      content = <EvolucaoSaldoChart evolucao={evolucao} />;
      break;
    case 'comparativo':
      content = <ReceitasDespesasChart receitasDespesas={receitasDespesas} />;
      break;
    case 'categorias':
      content = <GastosCategoriaChart porCategoria={porCategoria} />;
      break;
    case 'extrato':
      content = <ExtratoRecente transacoes={transacoes} limit={extratoLimite} />;
      break;
    case 'meta':
      content = (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <PiggyBank className="text-primary h-5 w-5" aria-hidden="true" />
              <CardTitle>Meta de economia</CardTitle>
            </div>
            <CardDescription>Acompanhe quanto você já economizou neste período</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="fc-card-metric">{formatCurrency(economiaAtual)}</p>
            <p className="fc-caption">Meta: {formatCurrency(metaEconomia)}</p>
            <div
              className="bg-muted h-2 overflow-hidden rounded-full"
              role="progressbar"
              aria-valuenow={Math.round(progressoMeta)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Progresso da meta de economia"
            >
              <div className="bg-primary h-full rounded-full" style={{ width: `${progressoMeta}%` }} />
            </div>
            <p className="text-sm">{Math.round(progressoMeta)}% da meta</p>
          </CardContent>
        </Card>
      );
      break;
    case 'alerta':
      content = (
        <Card className={alertaAtivo ? 'border-destructive/40' : undefined}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle
                className={alertaAtivo ? 'text-destructive h-5 w-5' : 'text-primary h-5 w-5'}
                aria-hidden="true"
              />
              <CardTitle>Alerta de gastos</CardTitle>
            </div>
            <CardDescription>Limite mensal de despesas: {formatCurrency(alertaGastos)}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="fc-card-metric">{formatCurrency(resumo.despesas)}</p>
            {alertaAtivo ? (
              <p className="text-destructive mt-2 text-sm" role="alert">
                Você ultrapassou o limite de gastos configurado.
              </p>
            ) : (
              <p className="text-success mt-2 text-sm">Gastos dentro do limite.</p>
            )}
          </CardContent>
        </Card>
      );
      break;
  }

  return (
    <WidgetWhenVisible id={id} lazy={CHART_WIDGET_IDS.has(id)}>
      {content}
    </WidgetWhenVisible>
  );
}
