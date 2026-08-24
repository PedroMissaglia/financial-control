type FiltrosLista = {
  busca: string;
  tipo: string;
  categoria: string;
  formaPagamento: string;
  dataInicio: string;
  dataFim: string;
  valorMin: number | null;
  valorMax: number | null;
};

const TZ_SAO_PAULO = 'America/Sao_Paulo';
const PRIMEIRO_MES_LISTA = 6;

export interface MesLista {
  competencia: string;
  label: string;
}

export function temFiltrosAtivos(filtros: FiltrosLista | null | undefined): boolean {
  if (!filtros) return false;
  return !!(
    filtros.busca.trim()
    || filtros.tipo
    || filtros.categoria
    || filtros.formaPagamento
    || filtros.dataInicio
    || filtros.dataFim
    || filtros.valorMin != null
    || filtros.valorMax != null
  );
}

export function dataHojeSaoPaulo(agora = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ_SAO_PAULO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(agora);
}

export function mesesAteCorrente(hoje = dataHojeSaoPaulo()): MesLista[] {
  const ano = hoje.slice(0, 4);
  const mesAtual = Number(hoje.slice(5, 7));
  const meses: MesLista[] = [];

  for (let mes = PRIMEIRO_MES_LISTA; mes <= mesAtual; mes += 1) {
    const competencia = `${ano}-${String(mes).padStart(2, '0')}`;
    meses.push({ competencia, label: labelMesDeAno(competencia) });
  }

  return meses;
}

export function labelMesDeAno(competencia: string): string {
  const [yearStr, monthStr] = competencia.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const mes = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date(year, month - 1, 1));
  return `${mes.charAt(0).toUpperCase() + mes.slice(1)} de ${year}`;
}

export function intervaloCompetencia(competencia: string): { dataInicio: string; dataFim: string } {
  const [yearStr, monthStr] = competencia.split('-');
  const lastDay = new Date(Date.UTC(Number(yearStr), Number(monthStr), 0)).getUTCDate();
  return {
    dataInicio: `${competencia}-01`,
    dataFim: `${competencia}-${String(lastDay).padStart(2, '0')}`,
  };
}
