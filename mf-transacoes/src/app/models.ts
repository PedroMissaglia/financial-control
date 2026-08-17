export type TipoTransacao = 'deposito' | 'transferencia' | 'saque' | 'pagamento';

export type CategoriaTransacao =
  | 'salario'
  | 'freelance'
  | 'moradia'
  | 'alimentacao'
  | 'transporte'
  | 'saude'
  | 'educacao'
  | 'lazer'
  | 'servicos'
  | 'transferencias'
  | 'outros';

export interface Transacao {
  id: string;
  usuarioId: string;
  tipo: TipoTransacao;
  valor: number;
  data: string;
  hora: string;
  descricao: string;
  categoria?: CategoriaTransacao;
}

export const TIPOS: { value: TipoTransacao | ''; label: string }[] = [
  { value: '', label: 'Todos os tipos' },
  { value: 'deposito', label: 'Depósito' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'saque', label: 'Saque' },
  { value: 'pagamento', label: 'Pagamento' },
];

export const CATEGORIAS: { value: CategoriaTransacao | ''; label: string }[] = [
  { value: '', label: 'Todas as categorias' },
  { value: 'salario', label: 'Salário' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'moradia', label: 'Moradia' },
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'saude', label: 'Saúde' },
  { value: 'educacao', label: 'Educação' },
  { value: 'lazer', label: 'Lazer' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'transferencias', label: 'Transferências' },
  { value: 'outros', label: 'Outros' },
];

export const TIPO_LABELS: Record<TipoTransacao, string> = {
  deposito: 'Depósito',
  transferencia: 'Transferência',
  saque: 'Saque',
  pagamento: 'Pagamento',
};

export const CATEGORIA_LABELS: Record<CategoriaTransacao, string> = {
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

export function sugerirCategoria(tipo: TipoTransacao): CategoriaTransacao {
  return tipo === 'deposito' ? 'salario' : 'outros';
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

export function formatDateShort(dateString: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(`${dateString}T12:00:00`));
}
