import { evolucaoSaldo, resumoFinanceiro, totaisPorCategoria } from '@/data/analises';
import { calcularSaldo, type Transacao } from '@/data/transacoes';

export interface DashboardWidgetAnalytics {
  saldo: number;
  resumo: ReturnType<typeof resumoFinanceiro>;
  evolucao: ReturnType<typeof evolucaoSaldo>;
  porCategoria: ReturnType<typeof totaisPorCategoria>;
  receitasDespesas: { name: string; valor: number }[];
}

export function buildWidgetAnalytics(transacoes: Transacao[]): DashboardWidgetAnalytics {
  const resumo = resumoFinanceiro(transacoes);
  return {
    saldo: calcularSaldo(transacoes),
    resumo,
    evolucao: evolucaoSaldo(transacoes),
    porCategoria: totaisPorCategoria(transacoes),
    receitasDespesas: [
      { name: 'Receitas', valor: resumo.receitas },
      { name: 'Despesas', valor: resumo.despesas },
    ],
  };
}
