import {
  calcularSaldo,
  FORMA_PAGAMENTO_LABELS,
  isEntrada,
  labelCategoria,
  TIPO_LABELS,
  type FormaPagamento,
  type TipoTransacao,
  type Transacao,
} from '@/data/transacoes';
import { formatDateShort } from '@/lib/utils';

export interface PontoSaldo {
  data: string;
  label: string;
  saldo: number;
}

export interface TotalPorGrupo {
  chave: string;
  label: string;
  valor: number;
}

export interface ResumoMensal {
  receitas: number;
  despesas: number;
  saldo: number;
}

export function evolucaoSaldo(transacoes: Transacao[]): PontoSaldo[] {
  const ordenadas = [...transacoes].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  let saldo = 0;
  const porDia = new Map<string, number>();

  for (const transacao of ordenadas) {
    saldo += isEntrada(transacao.tipo) ? transacao.valor : -transacao.valor;
    porDia.set(transacao.data, saldo);
  }

  return [...porDia.entries()].map(([data, valor]) => ({
    data,
    label: formatDateShort(data),
    saldo: Number(valor.toFixed(2)),
  }));
}

const TIPO_ORDEM: TipoTransacao[] = ['pagamento', 'deposito', 'saque', 'transferencia'];

export function totaisPorTipo(transacoes: Transacao[]): TotalPorGrupo[] {
  const totais = new Map<string, number>();

  for (const transacao of transacoes) {
    totais.set(transacao.tipo, (totais.get(transacao.tipo) ?? 0) + transacao.valor);
  }

  return TIPO_ORDEM.map(chave => ({
    chave,
    label: TIPO_LABELS[chave],
    valor: Number((totais.get(chave) ?? 0).toFixed(2)),
  }));
}

const FORMA_ORDEM: FormaPagamento[] = ['pix', 'credito', 'debito', 'vr_va'];

export function totaisPorFormaPagamento(transacoes: Transacao[]): TotalPorGrupo[] {
  const totais = new Map<FormaPagamento, number>();

  for (const transacao of transacoes) {
    if (isEntrada(transacao.tipo) || !transacao.formaPagamento) continue;
    totais.set(transacao.formaPagamento, (totais.get(transacao.formaPagamento) ?? 0) + transacao.valor);
  }

  return FORMA_ORDEM.map(chave => ({
    chave,
    label: FORMA_PAGAMENTO_LABELS[chave],
    valor: Number((totais.get(chave) ?? 0).toFixed(2)),
  }));
}

export function totaisPorCategoria(
  transacoes: Transacao[],
  labels?: Record<string, string>,
): TotalPorGrupo[] {
  const saidas = transacoes.filter(transacao => !isEntrada(transacao.tipo));
  const totais = new Map<string, number>();

  for (const transacao of saidas) {
    const chave = transacao.categoria || 'outros';
    totais.set(chave, (totais.get(chave) ?? 0) + transacao.valor);
  }

  return [...totais.entries()]
    .map(([chave, valor]) => ({
      chave,
      label: labelCategoria(chave, labels),
      valor: Number(valor.toFixed(2)),
    }))
    .sort((a, b) => b.valor - a.valor);
}

export function resumoFinanceiro(transacoes: Transacao[]): ResumoMensal {
  const receitas = transacoes.filter(t => isEntrada(t.tipo)).reduce((acc, t) => acc + t.valor, 0);
  const despesas = transacoes.filter(t => !isEntrada(t.tipo)).reduce((acc, t) => acc + t.valor, 0);

  return {
    receitas: Number(receitas.toFixed(2)),
    despesas: Number(despesas.toFixed(2)),
    saldo: Number(calcularSaldo(transacoes).toFixed(2)),
  };
}

const TZ_SAO_PAULO = 'America/Sao_Paulo';
const MES_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'] as const;

export interface PontoReceitasDespesasMes {
  mes: number;
  label: string;
  receitas: number;
  despesas: number;
}

export interface ReceitasDespesasAno {
  ano: number;
  meses: PontoReceitasDespesasMes[];
}

export function dataHojeSaoPaulo(agora = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ_SAO_PAULO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(agora);
}

export function transacoesDoMesCorrente(
  transacoes: Transacao[],
  hoje = dataHojeSaoPaulo(),
): Transacao[] {
  const competencia = hoje.slice(0, 7);
  return transacoes.filter(transacao => transacao.data.startsWith(competencia));
}

export function labelMesDeAno(competencia: string): string {
  const [yearStr, monthStr] = competencia.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const mes = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(year, month - 1, 1));
  return `${mes.charAt(0).toUpperCase() + mes.slice(1)} de ${year}`;
}

export function receitasDespesasPorMesAno(
  transacoes: Transacao[],
  hoje = dataHojeSaoPaulo(),
): ReceitasDespesasAno {
  const ano = Number(hoje.slice(0, 4));
  const mesAtual = Number(hoje.slice(5, 7));
  const totais = Array.from({ length: mesAtual }, () => ({ receitas: 0, despesas: 0 }));

  for (const transacao of transacoes) {
    if (!transacao.data.startsWith(`${ano}-`)) continue;
    const mes = Number(transacao.data.slice(5, 7));
    if (mes < 1 || mes > mesAtual) continue;
    const bucket = totais[mes - 1];
    if (!bucket) continue;
    if (isEntrada(transacao.tipo)) bucket.receitas += transacao.valor;
    else bucket.despesas += transacao.valor;
  }

  return {
    ano,
    meses: totais.map((item, index) => ({
      mes: index + 1,
      label: MES_LABELS[index] ?? `Mês ${index + 1}`,
      receitas: Number(item.receitas.toFixed(2)),
      despesas: Number(item.despesas.toFixed(2)),
    })),
  };
}
