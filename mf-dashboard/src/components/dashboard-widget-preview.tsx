import { lazy, Suspense } from 'react';
import { AlertTriangle, PiggyBank } from 'lucide-react';

import { ExtratoRecente } from '@/components/extrato-recente';
import { NovaTransacaoRapida } from '@/components/nova-transacao-rapida';
import { SaldoCard } from '@/components/saldo-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { evolucaoSaldo, resumoFinanceiro, totaisPorCategoria } from '@/data/analises';
import type { WidgetId } from '../../../shared/dashboard-contract';
import { calcularSaldo, type Transacao } from '@/data/transacoes';
import { formatCurrency } from '@/lib/utils';

const EvolucaoSaldoChart = lazy(() =>
  import('@/components/financeiro-charts').then(mod => ({ default: mod.EvolucaoSaldoChart })),
);
const ReceitasDespesasChart = lazy(() =>
  import('@/components/financeiro-charts').then(mod => ({ default: mod.ReceitasDespesasChart })),
);
const GastosCategoriaChart = lazy(() =>
  import('@/components/financeiro-charts').then(mod => ({ default: mod.GastosCategoriaChart })),
);

function ChartFallback() {
  return (
    <div className="bg-card flex min-h-64 items-center justify-center rounded-xl border p-4" role="status">
      <p className="text-muted-foreground text-sm">Carregando gráfico...</p>
    </div>
  );
}

export const WIDGET_LABELS: Record<WidgetId, string> = {
  saldo: 'Saldo',
  evolucao: 'Evolução do saldo',
  comparativo: 'Receitas vs despesas',
  categorias: 'Gastos por categoria',
  rapida: 'Transação rápida',
  extrato: 'Extrato recente',
  meta: 'Meta de economia',
  alerta: 'Alerta de gastos',
};

interface DashboardWidgetPreviewProps {
  id: WidgetId;
  transacoes: Transacao[];
  metaEconomia: number;
  alertaGastos: number;
  extratoLimite: number;
  apiUrl?: string;
}

export function DashboardWidgetPreview({
  id,
  transacoes,
  metaEconomia,
  alertaGastos,
  extratoLimite,
  apiUrl,
}: Readonly<DashboardWidgetPreviewProps>) {
  const saldo = calcularSaldo(transacoes);
  const resumo = resumoFinanceiro(transacoes);
  const evolucao = evolucaoSaldo(transacoes);
  const porCategoria = totaisPorCategoria(transacoes);
  const receitasDespesas = [
    { name: 'Receitas', valor: resumo.receitas },
    { name: 'Despesas', valor: resumo.despesas },
  ];
  const economiaAtual = resumo.receitas - resumo.despesas;
  const progressoMeta = metaEconomia > 0 ? Math.min(100, Math.max(0, (economiaAtual / metaEconomia) * 100)) : 0;
  const alertaAtivo = resumo.despesas > alertaGastos;

  switch (id) {
    case 'saldo':
      return <SaldoCard saldo={saldo} />;
    case 'rapida':
      return <NovaTransacaoRapida apiUrl={apiUrl} />;
    case 'evolucao':
      return (
        <Suspense fallback={<ChartFallback />}>
          <EvolucaoSaldoChart evolucao={evolucao} />
        </Suspense>
      );
    case 'comparativo':
      return (
        <Suspense fallback={<ChartFallback />}>
          <ReceitasDespesasChart receitasDespesas={receitasDespesas} />
        </Suspense>
      );
    case 'categorias':
      return (
        <Suspense fallback={<ChartFallback />}>
          <GastosCategoriaChart porCategoria={porCategoria} />
        </Suspense>
      );
    case 'extrato':
      return <ExtratoRecente transacoes={transacoes} limit={extratoLimite} />;
    case 'meta':
      return (
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
    case 'alerta':
      return (
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
  }
}
