export const MF_TRANSACOES_CHANGED = 'fincontrol:transacoes-changed';
export const MF_CATEGORIAS_CHANGED = 'fincontrol:categorias-changed';
export const MF_GASTOS_MENSAIS_CHANGED = 'fincontrol:gastos-mensais-changed';
export const MF_NAVIGATE = 'fincontrol:navigate';
export const MF_TRANSACOES_PAGE_SIZE = 'fincontrol:transacoes-page-size';
export const MF_TRANSACOES_PAGE_META = 'fincontrol:transacoes-page-meta';
export const MF_DELETE_TRANSACAO = 'fincontrol:delete-transacao';

export type MfNavigateDetail = {
  href: string;
};

export type MfTransacoesPageSizeDetail = {
  pageSize: number;
};

export type MfTransacoesPageMetaDetail = {
  total: number;
  totalUnfiltered: number;
};

export type MfDeleteTransacaoDetail = {
  id: string;
  descricao: string;
};

export function notifyTransacoesChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(MF_TRANSACOES_CHANGED));
}

export function notifyCategoriasChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(MF_CATEGORIAS_CHANGED));
}

export function notifyGastosMensaisChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(MF_GASTOS_MENSAIS_CHANGED));
}

export function getUsuarioIdFromCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(/(?:^|; )fincontrol_uid=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}
