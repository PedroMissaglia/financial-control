import { normalizarTransacao, type Transacao } from '@/data/transacoes';

export interface TransacoesPage {
  items: Transacao[];
  total: number;
  page: number;
  pageSize: number;
  totalUnfiltered: number;
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

export function parseTransacoesItems(json: unknown): Transacao[] {
  return parseTransacoesPage(json).items.map(item => normalizarTransacao(item));
}
