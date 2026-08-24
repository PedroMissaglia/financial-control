import {
  evolucaoSaldo,
  receitasDespesasPorMesAno,
  resumoFinanceiro,
  totaisPorCategoria,
  totaisPorFormaPagamento,
  totaisPorTipo,
  transacoesDoMesCorrente,
  competenciaDe,
  type PontoSaldo,
  type ReceitasDespesasAno,
  type TotalPorGrupo,
} from '@/data/analises';
import { resumoCompromissos, type GastoMensal } from '@/data/gastos-mensais';
import {
  FORMA_PAGAMENTO_LABELS,
  isEntrada,
  labelCategoria,
  TIPO_LABELS,
  type FormaPagamento,
  type TipoTransacao,
  calcularSaldo,
  type Transacao,
} from '@/data/transacoes';
import { formatDateShort } from '@/lib/utils';

export interface TotaisPorPessoa {
  usuarioId: string;
  nome: string;
  dataKey: string;
  saldo: number;
  receitas: number;
  despesas: number;
  receitasMes: number;
  despesasMes: number;
  compromissosTotal: number;
}

export interface FatiaReceitasDespesas {
  name: string;
  valor: number;
  kind: 'receita' | 'despesa';
  usuarioId: string;
  pessoaIndex: number;
}

export interface GrupoEmpilhado {
  chave: string;
  label: string;
  /** Valores por dataKey da pessoa */
  [dataKey: string]: string | number;
}

export interface PontoEvolucaoEmpilhado {
  data: string;
  label: string;
  [dataKey: string]: string | number;
}

export interface PontoAnoEmpilhado {
  mes: number;
  label: string;
  [dataKey: string]: string | number;
}

export interface DashboardWidgetAnalytics {
  competencia: string;
  saldo: number;
  resumo: ReturnType<typeof resumoFinanceiro>;
  resumoMes: ReturnType<typeof resumoFinanceiro>;
  evolucao: PontoSaldo[];
  porCategoria: TotalPorGrupo[];
  porTipo: TotalPorGrupo[];
  porForma: TotalPorGrupo[];
  receitasDespesas: { name: string; valor: number }[];
  receitasDespesasAno: ReceitasDespesasAno;
  compromissos: ReturnType<typeof resumoCompromissos>;
  porPessoa: TotaisPorPessoa[];
  /** true na visão conjunta com 2+ pessoas */
  fragmentado: boolean;
  receitasDespesasFatias: FatiaReceitasDespesas[];
  porCategoriaEmpilhado: GrupoEmpilhado[];
  porTipoEmpilhado: GrupoEmpilhado[];
  porFormaEmpilhado: GrupoEmpilhado[];
  evolucaoEmpilhado: PontoEvolucaoEmpilhado[];
  receitasDespesasAnoEmpilhado: { ano: number; meses: PontoAnoEmpilhado[]; series: { dataKey: string; nome: string; kind: 'receita' | 'despesa' }[] };
}

function dataKeyFor(usuarioId: string, index: number): string {
  const safe = usuarioId.replace(/[^a-zA-Z0-9]/g, '_');
  return `p_${index}_${safe}`;
}

const TIPO_ORDEM: TipoTransacao[] = ['pagamento', 'deposito', 'saque', 'transferencia'];
const FORMA_ORDEM: FormaPagamento[] = ['pix', 'credito', 'debito', 'vr_va'];
const MES_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'] as const;

function evolucaoPorPessoa(transacoes: Transacao[]): Map<string, number> {
  const ordenadas = [...transacoes].sort((a, b) => a.data.localeCompare(b.data) || (a.hora || '').localeCompare(b.hora || ''));
  let saldo = 0;
  const porDia = new Map<string, number>();
  for (const tx of ordenadas) {
    saldo += isEntrada(tx.tipo) ? tx.valor : -tx.valor;
    porDia.set(tx.data, Number(saldo.toFixed(2)));
  }
  return porDia;
}

export function buildWidgetAnalytics(
  transacoes: Transacao[],
  categoriaLabels?: Record<string, string>,
  gastos: GastoMensal[] = [],
  donoLabels?: Record<string, string>,
  competencia = competenciaDe(),
): DashboardWidgetAnalytics {
  const resumo = resumoFinanceiro(transacoes);
  const doMes = transacoesDoMesCorrente(transacoes, competencia);
  const resumoMes = resumoFinanceiro(doMes);

  const ids =
    donoLabels && Object.keys(donoLabels).length > 1
      ? Object.keys(donoLabels)
      : [...new Set(transacoes.map(item => item.usuarioId).filter(Boolean))];

  const fragmentado = ids.length > 1;

  const porPessoa: TotaisPorPessoa[] = fragmentado
    ? ids.map((usuarioId, index) => {
        const txs = transacoes.filter(item => item.usuarioId === usuarioId);
        const txsMes = doMes.filter(item => item.usuarioId === usuarioId);
        const r = resumoFinanceiro(txs);
        const rMes = resumoFinanceiro(txsMes);
        const gastosPessoa = gastos.filter(item => item.usuarioId === usuarioId);
        return {
          usuarioId,
          nome: donoLabels?.[usuarioId] ?? usuarioId,
          dataKey: dataKeyFor(usuarioId, index),
          saldo: calcularSaldo(txs),
          receitas: r.receitas,
          despesas: r.despesas,
          receitasMes: rMes.receitas,
          despesasMes: rMes.despesas,
          compromissosTotal: resumoCompromissos(gastosPessoa, competencia).total,
        };
      })
    : [];

  const receitasDespesasFatias: FatiaReceitasDespesas[] = fragmentado
    ? porPessoa.flatMap((pessoa, pessoaIndex) => [
        {
          name: `Receitas de ${pessoa.nome}`,
          valor: pessoa.receitasMes,
          kind: 'receita' as const,
          usuarioId: pessoa.usuarioId,
          pessoaIndex,
        },
        {
          name: `Despesas de ${pessoa.nome}`,
          valor: pessoa.despesasMes,
          kind: 'despesa' as const,
          usuarioId: pessoa.usuarioId,
          pessoaIndex,
        },
      ])
    : [];

  function empilharGrupo(
    chaves: { chave: string; label: string }[],
    valorDe: (txs: Transacao[], chave: string) => number,
    pool: Transacao[],
  ): GrupoEmpilhado[] {
    return chaves
      .map(({ chave, label }) => {
        const row: GrupoEmpilhado = { chave, label };
        let total = 0;
        for (const pessoa of porPessoa) {
          const txs = pool.filter(item => item.usuarioId === pessoa.usuarioId);
          const valor = valorDe(txs, chave);
          row[pessoa.dataKey] = valor;
          total += valor;
        }
        return { row, total };
      })
      .filter(item => item.total > 0)
      .map(item => item.row);
  }

  const porCategoriaEmpilhado = fragmentado
    ? (() => {
        const chaves = new Set<string>();
        for (const tx of doMes) {
          if (!isEntrada(tx.tipo)) chaves.add(tx.categoria || 'outros');
        }
        const lista = [...chaves].map(chave => ({
          chave,
          label: labelCategoria(chave, categoriaLabels),
        }));
        return empilharGrupo(
          lista,
          (txs, chave) =>
            txs
              .filter(t => !isEntrada(t.tipo) && (t.categoria || 'outros') === chave)
              .reduce((acc, t) => acc + t.valor, 0),
          doMes,
        ).sort((a, b) => {
          const sum = (row: GrupoEmpilhado) =>
            porPessoa.reduce((acc, p) => acc + Number(row[p.dataKey] ?? 0), 0);
          return sum(b) - sum(a);
        });
      })()
    : [];

  const porTipoEmpilhado = fragmentado
    ? empilharGrupo(
        TIPO_ORDEM.map(chave => ({ chave, label: TIPO_LABELS[chave] })),
        (txs, chave) => txs.filter(t => t.tipo === chave).reduce((acc, t) => acc + t.valor, 0),
        doMes,
      )
    : [];

  const porFormaEmpilhado = fragmentado
    ? empilharGrupo(
        FORMA_ORDEM.map(chave => ({ chave, label: FORMA_PAGAMENTO_LABELS[chave] })),
        (txs, chave) =>
          txs
            .filter(t => !isEntrada(t.tipo) && t.formaPagamento === chave)
            .reduce((acc, t) => acc + t.valor, 0),
        doMes,
      )
    : [];

  const evolucaoEmpilhado: PontoEvolucaoEmpilhado[] = fragmentado
    ? (() => {
        const maps = porPessoa.map(pessoa => ({
          pessoa,
          map: evolucaoPorPessoa(transacoes.filter(t => t.usuarioId === pessoa.usuarioId)),
        }));
        const datas = [...new Set(maps.flatMap(item => [...item.map.keys()]))].sort();
        const last = new Map<string, number>();
        for (const pessoa of porPessoa) last.set(pessoa.dataKey, 0);
        return datas.map(data => {
          const ponto: PontoEvolucaoEmpilhado = {
            data,
            label: formatDateShort(data),
          };
          for (const { pessoa, map } of maps) {
            if (map.has(data)) last.set(pessoa.dataKey, map.get(data) ?? 0);
            ponto[pessoa.dataKey] = last.get(pessoa.dataKey) ?? 0;
          }
          return ponto;
        });
      })()
    : [];

  const receitasDespesasAnoEmpilhado = fragmentado
    ? (() => {
        const competenciaAno = competenciaDe();
        const ano = Number(competenciaAno.slice(0, 4));
        const mesAtual = Number(competenciaAno.slice(5, 7));
        const series = porPessoa.flatMap(pessoa => [
          { dataKey: `${pessoa.dataKey}_rec`, nome: `Receitas de ${pessoa.nome}`, kind: 'receita' as const },
          { dataKey: `${pessoa.dataKey}_desp`, nome: `Despesas de ${pessoa.nome}`, kind: 'despesa' as const },
        ]);
        const meses: PontoAnoEmpilhado[] = Array.from({ length: mesAtual }, (_, index) => {
          const ponto: PontoAnoEmpilhado = {
            mes: index + 1,
            label: MES_LABELS[index] ?? `Mês ${index + 1}`,
          };
          for (const pessoa of porPessoa) {
            ponto[`${pessoa.dataKey}_rec`] = 0;
            ponto[`${pessoa.dataKey}_desp`] = 0;
          }
          return ponto;
        });
        for (const tx of transacoes) {
          if (!tx.data.startsWith(`${ano}-`)) continue;
          const mes = Number(tx.data.slice(5, 7));
          if (mes < 1 || mes > mesAtual) continue;
          const pessoa = porPessoa.find(p => p.usuarioId === tx.usuarioId);
          if (!pessoa) continue;
          const bucket = meses[mes - 1];
          if (!bucket) continue;
          const key = isEntrada(tx.tipo) ? `${pessoa.dataKey}_rec` : `${pessoa.dataKey}_desp`;
          bucket[key] = Number(((Number(bucket[key]) || 0) + tx.valor).toFixed(2));
        }
        return { ano, meses, series };
      })()
    : { ano: Number(competenciaDe().slice(0, 4)), meses: [], series: [] };

  return {
    competencia,
    saldo: calcularSaldo(transacoes),
    resumo,
    resumoMes,
    evolucao: evolucaoSaldo(transacoes),
    porCategoria: totaisPorCategoria(doMes, categoriaLabels),
    porTipo: totaisPorTipo(doMes),
    porForma: totaisPorFormaPagamento(doMes),
    receitasDespesas: [
      { name: 'Receitas', valor: resumoMes.receitas },
      { name: 'Despesas', valor: resumoMes.despesas },
    ],
    receitasDespesasAno: receitasDespesasPorMesAno(transacoes),
    compromissos: resumoCompromissos(gastos, competencia),
    porPessoa,
    fragmentado,
    receitasDespesasFatias,
    porCategoriaEmpilhado,
    porTipoEmpilhado,
    porFormaEmpilhado,
    evolucaoEmpilhado,
    receitasDespesasAnoEmpilhado,
  };
}
