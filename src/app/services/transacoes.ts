import type { NovaTransacao, Transacao, TransacaoAnexo } from '@/data/transacoes';
import { normalizarTransacao } from '@/data/transacoes';
import { apiFetch, readApiError } from '@/lib/api-client';
import { notifyTransacoesChanged } from '@/lib/mf-events';
import type { TransacoesFiltros } from '@/lib/transacao-filters';
import { appendUsuarioIds, normalizeUsuarioIds } from '@/lib/usuario-ids';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  status?: number;
}

export interface TransacoesPage {
  items: Transacao[];
  total: number;
  page: number;
  pageSize: number;
  totalUnfiltered: number;
}

export interface FetchTransacoesPageParams {
  usuarioId?: string | string[];
  page: number;
  pageSize: number;
  filtros?: TransacoesFiltros;
}

export function parseTransacoesPage(json: unknown): TransacoesPage {
  if (Array.isArray(json)) {
    const items = json as Transacao[];
    return {
      items,
      total: items.length,
      page: 1,
      pageSize: items.length,
      totalUnfiltered: items.length,
    };
  }

  if (json && typeof json === 'object' && Array.isArray((json as TransacoesPage).items)) {
    const page = json as TransacoesPage;
    const items = page.items;
    return {
      items,
      total: Number(page.total) || 0,
      page: Math.max(1, Number(page.page) || 1),
      pageSize: Number(page.pageSize) || items.length,
      totalUnfiltered: Number(page.totalUnfiltered) || 0,
    };
  }

  return { items: [], total: 0, page: 1, pageSize: 0, totalUnfiltered: 0 };
}

function appendFiltros(search: URLSearchParams, filtros?: TransacoesFiltros) {
  if (!filtros) return;
  const busca = filtros.busca.trim();
  if (busca) search.set('busca', busca);
  if (filtros.tipo) search.set('tipo', filtros.tipo);
  if (filtros.categoria) search.set('categoria', filtros.categoria);
  if (filtros.formaPagamento) search.set('formaPagamento', filtros.formaPagamento);
  if (filtros.dataInicio) search.set('dataInicio', filtros.dataInicio);
  if (filtros.dataFim) search.set('dataFim', filtros.dataFim);
  if (filtros.valorMin != null) search.set('valorMin', String(filtros.valorMin));
  if (filtros.valorMax != null) search.set('valorMax', String(filtros.valorMax));
}

export function buildTransacoesQuery(params: {
  usuarioId?: string | string[];
  page?: number;
  pageSize?: number;
  filtros?: TransacoesFiltros;
}): string {
  const search = new URLSearchParams();
  appendUsuarioIds(search, normalizeUsuarioIds(params.usuarioId));

  if (params.page != null) {
    search.set('page', String(Math.max(1, params.page)));
  }
  if (params.pageSize != null) {
    search.set('pageSize', String(params.pageSize));
  }

  appendFiltros(search, params.filtros);
  return search.toString();
}

function normalizePage(page: TransacoesPage): TransacoesPage {
  return {
    ...page,
    items: page.items.map(normalizarTransacao),
  };
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (!response.ok) {
    const message = await response.text();
    return { success: false, message: message || 'Erro na requisição' };
  }

  const data = (await response.json()) as T;
  return { success: true, data };
}

export async function fetchTransacoes(usuarioId?: string | string[]): Promise<ApiResponse<Transacao[]>> {
  const ids = normalizeUsuarioIds(usuarioId);
  if (ids.length === 0) {
    return { success: true, data: [] };
  }

  try {
    const response = await apiFetch(`/transacoes?${buildTransacoesQuery({ usuarioId: ids })}`);
    if (!response.ok) {
      return { success: false, message: 'Erro ao carregar transações', status: response.status };
    }
    const json: unknown = await response.json();
    return { success: true, data: normalizePage(parseTransacoesPage(json)).items };
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    return { success: false, message: 'Não foi possível conectar à API', status: 0 };
  }
}

export async function fetchTransacoesPage(params: FetchTransacoesPageParams): Promise<ApiResponse<TransacoesPage>> {
  try {
    const query = buildTransacoesQuery({
      usuarioId: params.usuarioId,
      page: Math.max(1, params.page),
      pageSize: params.pageSize,
      filtros: params.filtros,
    });
    const response = await apiFetch(`/transacoes?${query}`);
    if (!response.ok) {
      return { success: false, message: 'Erro ao carregar transações', status: response.status };
    }
    const json: unknown = await response.json();
    return { success: true, data: normalizePage(parseTransacoesPage(json)) };
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    return { success: false, message: 'Não foi possível conectar à API', status: 0 };
  }
}

export async function fetchTransacaoById(id: string): Promise<ApiResponse<Transacao>> {
  try {
    const response = await apiFetch(`/transacoes/${id}`);
    if (!response.ok) {
      return {
        success: false,
        message: response.status === 404 ? 'Transação não encontrada' : 'Não foi possível carregar a transação',
        status: response.status,
      };
    }
    const result = await handleResponse<Transacao>(response);
    return {
      ...result,
      status: response.status,
      data: result.data ? normalizarTransacao(result.data) : result.data,
    };
  } catch (error) {
    console.error('Erro ao buscar transação:', error);
    return { success: false, message: 'Não foi possível conectar à API', status: 0 };
  }
}

export async function hydrateTransacaoAnexo(transacao: Transacao): Promise<Transacao> {
  if (transacao.anexo || !transacao.anexoId) return transacao;
  const result = await fetchAnexo(transacao.anexoId);
  return result.data ? { ...transacao, anexo: result.data } : transacao;
}

export async function fetchAnexo(id: string): Promise<ApiResponse<TransacaoAnexo>> {
  try {
    const response = await apiFetch(`/anexos/${encodeURIComponent(id)}`);
    if (!response.ok) {
      return {
        success: false,
        message: response.status === 404 ? 'Anexo não encontrado' : await readApiError(response),
        status: response.status,
      };
    }
    const data = (await response.json()) as TransacaoAnexo;
    return { success: true, data, status: response.status };
  } catch (error) {
    console.error('Erro ao buscar anexo:', error);
    return { success: false, message: 'Não foi possível conectar à API', status: 0 };
  }
}

export async function createTransacao(transacao: NovaTransacao): Promise<ApiResponse<Transacao>> {
  try {
    const response = await apiFetch('/transacoes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transacao),
    });
    const result = await handleResponse<Transacao>(response);
    if (result.success) notifyTransacoesChanged();
    return result;
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    return { success: false, message: 'Não foi possível conectar à API' };
  }
}

export async function updateTransacao(id: string, transacao: NovaTransacao): Promise<ApiResponse<Transacao>> {
  try {
    const response = await apiFetch(`/transacoes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...transacao, id }),
    });
    const result = await handleResponse<Transacao>(response);
    if (result.success) notifyTransacoesChanged();
    return result;
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    return { success: false, message: 'Não foi possível conectar à API' };
  }
}

export async function deleteTransacao(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await apiFetch(`/transacoes/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      return { success: false, message: 'Erro ao excluir transação' };
    }
    notifyTransacoesChanged();
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir transação:', error);
    return { success: false, message: 'Não foi possível conectar à API' };
  }
}

