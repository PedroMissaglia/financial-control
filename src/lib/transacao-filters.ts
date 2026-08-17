import {
  CATEGORIA_LABELS,
  CATEGORIAS_TRANSACAO,
  TIPO_LABELS,
  TIPOS_TRANSACAO,
  type CategoriaTransacao,
  type TipoTransacao,
  type Transacao,
} from '@/data/transacoes';
import { formatCurrency, formatDateShort } from '@/lib/utils';

export interface TransacoesFiltros {
  busca: string;
  tipo: string;
  categoria: string;
  dataInicio: string;
  dataFim: string;
  valorMin: number | null;
  valorMax: number | null;
}

export const FILTROS_VAZIOS: TransacoesFiltros = {
  busca: '',
  tipo: '',
  categoria: '',
  dataInicio: '',
  dataFim: '',
  valorMin: null,
  valorMax: null,
};

export interface FiltroChip {
  key: keyof TransacoesFiltros;
  label: string;
}

export function temFiltrosAtivos(filtros: TransacoesFiltros): boolean {
  return !!(
    filtros.busca.trim()
    || filtros.tipo
    || filtros.categoria
    || filtros.dataInicio
    || filtros.dataFim
    || filtros.valorMin != null
    || filtros.valorMax != null
  );
}

export function contagemResultados(total: number, visiveis: number, filtros: TransacoesFiltros): string {
  if (total === 0) return 'Nenhuma transação';

  if (!temFiltrosAtivos(filtros)) {
    return total === 1 ? '1 transação' : `${total} transações`;
  }

  return `${visiveis} de ${total} transações`;
}

export function filtrarTransacoes(items: Transacao[], filtros: TransacoesFiltros): Transacao[] {
  const termo = filtros.busca.trim().toLowerCase();

  return items
    .filter(item => {
      const matchBusca = !termo || item.descricao.toLowerCase().includes(termo);
      const matchTipo = !filtros.tipo || item.tipo === filtros.tipo;
      const matchCategoria = !filtros.categoria || item.categoria === filtros.categoria;
      const matchInicio = !filtros.dataInicio || item.data >= filtros.dataInicio;
      const matchFim = !filtros.dataFim || item.data <= filtros.dataFim;
      const matchMin = filtros.valorMin == null || item.valor >= filtros.valorMin;
      const matchMax = filtros.valorMax == null || item.valor <= filtros.valorMax;
      return matchBusca && matchTipo && matchCategoria && matchInicio && matchFim && matchMin && matchMax;
    })
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
}

export function chipsFiltros(filtros: TransacoesFiltros): FiltroChip[] {
  const chips: FiltroChip[] = [];
  const termo = filtros.busca.trim();

  if (termo) chips.push({ key: 'busca', label: `Busca: ${termo}` });

  if (filtros.tipo) {
    const tipo = filtros.tipo as TipoTransacao;
    chips.push({ key: 'tipo', label: `Tipo: ${TIPO_LABELS[tipo] ?? filtros.tipo}` });
  }

  if (filtros.categoria) {
    const categoria = filtros.categoria as CategoriaTransacao;
    chips.push({ key: 'categoria', label: `Categoria: ${CATEGORIA_LABELS[categoria] ?? filtros.categoria}` });
  }

  if (filtros.dataInicio) {
    chips.push({ key: 'dataInicio', label: `De: ${formatDateShort(filtros.dataInicio)}` });
  }

  if (filtros.dataFim) {
    chips.push({ key: 'dataFim', label: `Até: ${formatDateShort(filtros.dataFim)}` });
  }

  if (filtros.valorMin != null) {
    chips.push({ key: 'valorMin', label: `Mín.: ${formatCurrency(filtros.valorMin)}` });
  }

  if (filtros.valorMax != null) {
    chips.push({ key: 'valorMax', label: `Máx.: ${formatCurrency(filtros.valorMax)}` });
  }

  return chips;
}

export const TIPOS_FILTRO = [{ value: '', label: 'Todos os tipos' }, ...TIPOS_TRANSACAO] as const;

export const CATEGORIAS_FILTRO = [{ value: '', label: 'Todas as categorias' }, ...CATEGORIAS_TRANSACAO] as const;

export function removerFiltro(filtros: TransacoesFiltros, key: keyof TransacoesFiltros): TransacoesFiltros {
  switch (key) {
    case 'busca':
      return { ...filtros, busca: '' };
    case 'tipo':
      return { ...filtros, tipo: '' };
    case 'categoria':
      return { ...filtros, categoria: '' };
    case 'dataInicio':
      return { ...filtros, dataInicio: '' };
    case 'dataFim':
      return { ...filtros, dataFim: '' };
    case 'valorMin':
      return { ...filtros, valorMin: null };
    case 'valorMax':
      return { ...filtros, valorMax: null };
    default:
      return filtros;
  }
}

export function mergeTransacoesFiltros(stored: Partial<TransacoesFiltros> | null | undefined): TransacoesFiltros {
  if (!stored || typeof stored !== 'object') return { ...FILTROS_VAZIOS };

  const tiposValidos = new Set<string>(TIPOS_TRANSACAO.map(item => item.value));
  const categoriasValidas = new Set<string>(CATEGORIAS_TRANSACAO.map(item => item.value));

  const tipo =
    typeof stored.tipo === 'string' && (stored.tipo === '' || tiposValidos.has(stored.tipo)) ? stored.tipo : '';
  const categoria =
    typeof stored.categoria === 'string' && (stored.categoria === '' || categoriasValidas.has(stored.categoria))
      ? stored.categoria
      : '';

  return {
    busca: typeof stored.busca === 'string' ? stored.busca : '',
    tipo,
    categoria,
    dataInicio: typeof stored.dataInicio === 'string' ? stored.dataInicio : '',
    dataFim: typeof stored.dataFim === 'string' ? stored.dataFim : '',
    valorMin: typeof stored.valorMin === 'number' && Number.isFinite(stored.valorMin) ? stored.valorMin : null,
    valorMax: typeof stored.valorMax === 'number' && Number.isFinite(stored.valorMax) ? stored.valorMax : null,
  };
}
