import {
  calcularSaldo,
  CATEGORIA_LABELS,
  type CategoriaTransacao,
  isEntrada,
  TIPO_LABELS,
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

export function totaisPorTipo(transacoes: Transacao[]): TotalPorGrupo[] {
  const totais = new Map<string, number>();

  for (const transacao of transacoes) {
    totais.set(transacao.tipo, (totais.get(transacao.tipo) ?? 0) + transacao.valor);
  }

  return [...totais.entries()].map(([chave, valor]) => ({
    chave,
    label: TIPO_LABELS[chave as keyof typeof TIPO_LABELS] ?? chave,
    valor: Number(valor.toFixed(2)),
  }));
}

export function totaisPorCategoria(transacoes: Transacao[]): TotalPorGrupo[] {
  const saidas = transacoes.filter(transacao => !isEntrada(transacao.tipo));
  const totais = new Map<CategoriaTransacao, number>();

  for (const transacao of saidas) {
    totais.set(transacao.categoria, (totais.get(transacao.categoria) ?? 0) + transacao.valor);
  }

  return [...totais.entries()]
    .map(([chave, valor]) => ({
      chave,
      label: CATEGORIA_LABELS[chave],
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
