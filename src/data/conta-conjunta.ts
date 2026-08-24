export type ContaConjuntaStatus = 'nenhuma' | 'convite_enviado' | 'convite_recebido' | 'ativa';

export type VisaoFinanceira = 'eu' | 'parceiro' | 'conjunto';

export interface ContaConjuntaParceiro {
  id: string;
  nome: string;
  email: string;
}

export interface ContaConjuntaConvite {
  id: string;
  email: string;
  criadoEm: string;
}

export interface ContaConjuntaView {
  status: ContaConjuntaStatus;
  parceiro: ContaConjuntaParceiro | null;
  convite: ContaConjuntaConvite | null;
}

export const CONTA_CONJUNTA_VAZIA: ContaConjuntaView = {
  status: 'nenhuma',
  parceiro: null,
  convite: null,
};

export const VISAO_STORAGE_KEY = 'fincontrol:visao';

export function primeiroNome(nome: string | null | undefined): string {
  const trimmed = nome?.trim() ?? '';
  if (!trimmed) return 'Cônjuge';
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

export function visaoLabel(visao: VisaoFinanceira, parceiroNome?: string | null): string {
  if (visao === 'parceiro') return primeiroNome(parceiroNome);
  if (visao === 'conjunto') return 'Conjunta';
  return 'Eu';
}
