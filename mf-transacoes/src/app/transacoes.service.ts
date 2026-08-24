import { Injectable } from '@angular/core';

import { Transacao } from './models';

const AUTH_STORAGE_KEY = 'fincontrol:auth';

export interface TransacoesListFiltros {
  busca?: string;
  tipo?: string;
  categoria?: string;
  formaPagamento?: string;
  dataInicio?: string;
  dataFim?: string;
  valorMin?: number | null;
  valorMax?: number | null;
}

export interface TransacoesPage {
  items: Transacao[];
  total: number;
  page: number;
  pageSize: number;
  totalUnfiltered: number;
}

export interface ListarTransacoesParams {
  page: number;
  pageSize: number;
  filtros?: TransacoesListFiltros;
}

function readAccessToken(fallback?: string): string | undefined {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { accessToken?: string | null };
      if (parsed.accessToken) return parsed.accessToken;
    }
  } catch {
    /* ignore */
  }
  return fallback || undefined;
}

function parseTransacoesPage(json: unknown): TransacoesPage {
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
    return {
      items: page.items,
      total: Number(page.total) || 0,
      page: Math.max(1, Number(page.page) || 1),
      pageSize: Number(page.pageSize) || page.items.length,
      totalUnfiltered: Number(page.totalUnfiltered) || 0,
    };
  }

  return { items: [], total: 0, page: 1, pageSize: 0, totalUnfiltered: 0 };
}

function buildQuery(usuarioIds: string[], params: ListarTransacoesParams): string {
  const search = new URLSearchParams();
  if (usuarioIds.length > 0) {
    search.set('usuarioId', usuarioIds[0]);
    if (usuarioIds.length > 1) search.set('usuarioIds', usuarioIds.join(','));
  }
  search.set('page', String(Math.max(1, params.page)));
  search.set('pageSize', String(params.pageSize));

  const filtros = params.filtros;
  if (filtros) {
    const busca = filtros.busca?.trim();
    if (busca) search.set('busca', busca);
    if (filtros.tipo) search.set('tipo', filtros.tipo);
    if (filtros.categoria) search.set('categoria', filtros.categoria);
    if (filtros.formaPagamento) search.set('formaPagamento', filtros.formaPagamento);
    if (filtros.dataInicio) search.set('dataInicio', filtros.dataInicio);
    if (filtros.dataFim) search.set('dataFim', filtros.dataFim);
    if (filtros.valorMin != null) search.set('valorMin', String(filtros.valorMin));
    if (filtros.valorMax != null) search.set('valorMax', String(filtros.valorMax));
  }

  return search.toString();
}

@Injectable({ providedIn: 'root' })
export class TransacoesService {
  listar(
    apiUrl: string,
    usuarioIds: string | string[],
    accessToken: string | undefined,
    params: ListarTransacoesParams,
  ): Promise<TransacoesPage> {
    const ids = Array.isArray(usuarioIds) ? usuarioIds.filter(Boolean) : usuarioIds ? [usuarioIds] : [];
    const url = `${apiUrl}/transacoes?${buildQuery(ids, params)}`;
    const token = readAccessToken(accessToken);
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    return fetch(url, { cache: 'no-store', headers }).then(async response => {
      if (!response.ok) {
        throw new Error('Não foi possível carregar as transações.');
      }
      return parseTransacoesPage(await response.json());
    });
  }

  listarCategoriaLabels(
    apiUrl: string,
    usuarioIds: string | string[],
    accessToken: string | undefined,
  ): Promise<Record<string, string>> {
    const ids = Array.isArray(usuarioIds) ? usuarioIds.filter(Boolean) : usuarioIds ? [usuarioIds] : [];
    const search = new URLSearchParams();
    if (ids.length > 0) {
      search.set('usuarioId', ids[0]);
      if (ids.length > 1) search.set('usuarioIds', ids.join(','));
    }
    const url = `${apiUrl}/categorias?${search.toString()}`;
    const token = readAccessToken(accessToken);
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    return fetch(url, { cache: 'no-store', headers }).then(async response => {
      if (!response.ok) return {};
      const json: unknown = await response.json();
      if (!Array.isArray(json)) return {};
      return Object.fromEntries(
        json
          .filter((item): item is { id: string; nome: string } => {
            return !!item && typeof item === 'object' && 'id' in item && 'nome' in item;
          })
          .map(item => [String(item.id), String(item.nome)]),
      );
    });
  }
}
