export type TipoTransacao = 'deposito' | 'transferencia' | 'saque' | 'pagamento';

export type FormaPagamento = 'credito' | 'debito' | 'pix' | 'vr_va';

export interface Transacao {
  id: string;
  usuarioId: string;
  tipo: TipoTransacao;
  valor: number;
  data: string;
  hora: string;
  descricao: string;
  categoria?: string;
  formaPagamento?: FormaPagamento | null;
  anexoId?: string | null;
}

export const TIPOS: { value: TipoTransacao | ''; label: string }[] = [
  { value: '', label: 'Todos os tipos' },
  { value: 'deposito', label: 'Depósito' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'saque', label: 'Saque' },
  { value: 'pagamento', label: 'Pagamento' },
];

export const FORMAS_PAGAMENTO: { value: FormaPagamento | ''; label: string }[] = [
  { value: '', label: 'Todas as formas' },
  { value: 'credito', label: 'Crédito' },
  { value: 'debito', label: 'Débito' },
  { value: 'pix', label: 'Pix' },
  { value: 'vr_va', label: 'VR/VA' },
];

export const TIPO_LABELS: Record<TipoTransacao, string> = {
  deposito: 'Depósito',
  transferencia: 'Transferência',
  saque: 'Saque',
  pagamento: 'Pagamento',
};

export const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  credito: 'Crédito',
  debito: 'Débito',
  pix: 'Pix',
  vr_va: 'VR/VA',
};

export const CATEGORIA_LABELS: Record<string, string> = {
  salario: 'Salário',
  freelance: 'Freelance',
  moradia: 'Moradia',
  alimentacao: 'Alimentação',
  transporte: 'Transporte',
  saude: 'Saúde',
  educacao: 'Educação',
  lazer: 'Lazer',
  servicos: 'Serviços',
  transferencias: 'Transferências',
  outros: 'Outros',
};

export function isEntrada(tipo: TipoTransacao): boolean {
  return tipo === 'deposito';
}

export function labelCategoria(id: string | undefined, extras?: Record<string, string>): string {
  if (!id) return 'Outros';
  if (extras?.[id]) return extras[id];
  return CATEGORIA_LABELS[id] ?? id;
}

export function labelFormaPagamento(value: FormaPagamento | null | undefined): string {
  if (!value) return '—';
  return FORMA_PAGAMENTO_LABELS[value] ?? value;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDateShort(dateString: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${dateString}T12:00:00`));
}
