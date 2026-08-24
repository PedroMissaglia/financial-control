import {
  evolucaoSaldo,
  receitasDespesasPorMesAno,
  resumoFinanceiro,
  totaisPorCategoria,
  totaisPorFormaPagamento,
  totaisPorTipo,
  transacoesDoMesCorrente,
} from '@/data/analises';
import { resumoCompromissos, type GastoMensal } from '@/data/gastos-mensais';
import { calcularSaldo, type Transacao } from '@/data/transacoes';

export interface DashboardWidgetAnalytics {
  saldo: number;
  resumo: ReturnType<typeof resumoFinanceiro>;
  evolucao: ReturnType<typeof evolucaoSaldo>;
  porCategoria: ReturnType<typeof totaisPorCategoria>;
  porTipo: ReturnType<typeof totaisPorTipo>;
  porForma: ReturnType<typeof totaisPorFormaPagamento>;
  receitasDespesas: { name: string; valor: number }[];
  receitasDespesasAno: ReturnType<typeof receitasDespesasPorMesAno>;
  compromissos: ReturnType<typeof resumoCompromissos>;
}

export function buildWidgetAnalytics(
  transacoes: Transacao[],
  categoriaLabels?: Record<string, string>,
  gastos: GastoMensal[] = [],
): DashboardWidgetAnalytics {
  const resumo = resumoFinanceiro(transacoes);
  const doMes = transacoesDoMesCorrente(transacoes);
  const resumoMes = resumoFinanceiro(doMes);
  return {
    saldo: calcularSaldo(transacoes),
    resumo,
    evolucao: evolucaoSaldo(transacoes),
    porCategoria: totaisPorCategoria(doMes, categoriaLabels),
    porTipo: totaisPorTipo(transacoes),
    porForma: totaisPorFormaPagamento(transacoes),
    receitasDespesas: [
      { name: 'Receitas', valor: resumoMes.receitas },
      { name: 'Despesas', valor: resumoMes.despesas },
    ],
    receitasDespesasAno: receitasDespesasPorMesAno(transacoes),
    compromissos: resumoCompromissos(gastos),
  };
}
