import type { FormaPagamento } from '@/data/transacoes';

export interface GastoMensal {
  id: string;
  usuarioId: string;
  titulo: string;
  descricao: string;
  diaVencimento: number;
  valor: number;
  categoria: string;
  formaPagamento: FormaPagamento | null;
  pago: boolean;
  transacaoId: string | null;
}

export interface GastoMensalInput {
  titulo: string;
  descricao?: string;
  diaVencimento: number;
  valor: number;
  categoria: string;
  formaPagamento?: FormaPagamento | null;
}

const TZ_SAO_PAULO = 'America/Sao_Paulo';

export function dataHojeSaoPaulo(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ_SAO_PAULO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function competenciaAtual(): string {
  return dataHojeSaoPaulo().slice(0, 7);
}

export function clampDiaVencimento(competencia: string, dia: number): number {
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

export function shiftCompetencia(competencia: string, delta: number): string {
  const [year, month] = competencia.split('-').map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function labelCompetencia(competencia: string): string {
  const [year, month] = competencia.split('-').map(Number);
  const raw = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
    new Date(year, month - 1, 1),
  );
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}
