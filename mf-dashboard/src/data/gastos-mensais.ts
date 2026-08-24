import { dataHojeSaoPaulo, labelMesDeAno } from '@/data/analises';

export interface GastoMensal {
  id: string;
  titulo: string;
  diaVencimento: number;
  valor: number;
  pago: boolean;
  usuarioId?: string;
}

export interface TotalCompromisso {
  quantidade: number;
  valor: number;
}

export interface LinhaCompromisso {
  id: string;
  titulo: string;
  diaVencimento: number;
  valor: number;
  situacao: 'pago' | 'aberto' | 'atrasado';
}

export interface ResumoCompromissos {
  competencia: string;
  pago: TotalCompromisso;
  aberto: TotalCompromisso;
  atrasado: TotalCompromisso;
  total: number;
  titulosAtrasados: string[];
  linhas: LinhaCompromisso[];
}

export function competenciaAtual(hoje = dataHojeSaoPaulo()): string {
  return hoje.slice(0, 7);
}

export function labelGastosMensaisTitulo(competencia: string): string {
  return `Gastos mensais · ${labelMesDeAno(competencia)}`;
}

function clampDiaVencimento(competencia: string, dia: number): number {
  const [yearStr, monthStr] = competencia.split('-');
  const lastDay = new Date(Date.UTC(Number(yearStr), Number(monthStr), 0)).getUTCDate();
  return Math.min(Math.max(dia, 1), lastDay);
}

export function isGastoMensalAtrasado(
  gasto: Pick<GastoMensal, 'pago' | 'diaVencimento'>,
  competencia: string,
  hoje = dataHojeSaoPaulo(),
): boolean {
  if (gasto.pago) return false;
  const dia = String(clampDiaVencimento(competencia, gasto.diaVencimento)).padStart(2, '0');
  return `${competencia}-${dia}` < hoje;
}

function emptyTotal(): TotalCompromisso {
  return { quantidade: 0, valor: 0 };
}

export function resumoCompromissos(
  gastos: GastoMensal[],
  competencia = competenciaAtual(),
  hoje = dataHojeSaoPaulo(),
): ResumoCompromissos {
  const pago = emptyTotal();
  const aberto = emptyTotal();
  const atrasado = emptyTotal();
  const titulosAtrasados: string[] = [];
  const linhas: LinhaCompromisso[] = [];

  for (const gasto of gastos) {
    let situacao: LinhaCompromisso['situacao'] = 'aberto';
    if (gasto.pago) {
      pago.quantidade += 1;
      pago.valor += gasto.valor;
      situacao = 'pago';
    } else if (isGastoMensalAtrasado(gasto, competencia, hoje)) {
      atrasado.quantidade += 1;
      atrasado.valor += gasto.valor;
      titulosAtrasados.push(gasto.titulo);
      situacao = 'atrasado';
    } else {
      aberto.quantidade += 1;
      aberto.valor += gasto.valor;
    }
    linhas.push({
      id: gasto.id,
      titulo: gasto.titulo,
      diaVencimento: gasto.diaVencimento,
      valor: gasto.valor,
      situacao,
    });
  }

  const ordem: Record<LinhaCompromisso['situacao'], number> = { atrasado: 0, pago: 1, aberto: 2 };
  linhas.sort((a, b) => ordem[a.situacao] - ordem[b.situacao] || a.diaVencimento - b.diaVencimento);

  return {
    competencia,
    pago: { quantidade: pago.quantidade, valor: Number(pago.valor.toFixed(2)) },
    aberto: { quantidade: aberto.quantidade, valor: Number(aberto.valor.toFixed(2)) },
    atrasado: { quantidade: atrasado.quantidade, valor: Number(atrasado.valor.toFixed(2)) },
    total: Number((pago.valor + aberto.valor + atrasado.valor).toFixed(2)),
    titulosAtrasados,
    linhas,
  };
}
