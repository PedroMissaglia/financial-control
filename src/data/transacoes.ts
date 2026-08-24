export type TipoTransacao = 'deposito' | 'transferencia' | 'saque' | 'pagamento';

export const FORMAS_PAGAMENTO_IDS = ['credito', 'debito', 'pix', 'vr_va'] as const;

export type FormaPagamento = (typeof FORMAS_PAGAMENTO_IDS)[number];

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

export interface TransacaoAnexo {
  id?: string;
  nome: string;
  mimeType: string;
  dataUrl: string;
}

export interface Transacao {
  id: string;
  usuarioId: string;
  tipo: TipoTransacao;
  valor: number;
  data: string;
  hora: string;
  descricao: string;
  categoria: string;
  formaPagamento?: FormaPagamento | null;
  anexoId?: string | null;
  anexo?: TransacaoAnexo | null;
}

export interface NovaTransacao {
  usuarioId: string;
  tipo: TipoTransacao;
  valor: number;
  data: string;
  hora: string;
  descricao: string;
  categoria: string;
  formaPagamento?: FormaPagamento | null;
  anexo?: TransacaoAnexo | null;
}

export function agoraLocal() {
  const n = new Date();
  const pad = (v: number) => String(v).padStart(2, '0');
  return {
    data: `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`,
    hora: `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`,
  };
}

function horaDe(item: Transacao): string {
  return item.hora || '00:00:00';
}

export const TIPOS_TRANSACAO: { value: TipoTransacao; label: string }[] = [
  { value: 'deposito', label: 'Depósito' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'saque', label: 'Saque' },
  { value: 'pagamento', label: 'Pagamento' },
];

export const TIPO_LABELS: Record<TipoTransacao, string> = {
  deposito: 'Depósito',
  transferencia: 'Transferência',
  saque: 'Saque',
  pagamento: 'Pagamento',
};

export const FORMAS_PAGAMENTO: { value: FormaPagamento; label: string }[] = [
  { value: 'credito', label: 'Crédito' },
  { value: 'debito', label: 'Débito' },
  { value: 'pix', label: 'Pix' },
  { value: 'vr_va', label: 'VR/VA' },
];

export const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  credito: 'Crédito',
  debito: 'Débito',
  pix: 'Pix',
  vr_va: 'VR/VA',
};

export const CATEGORIAS_TRANSACAO: { value: CategoriaTransacao; label: string }[] = [
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

const CATEGORIA_KEYWORDS: { pattern: RegExp; categoria: CategoriaTransacao }[] = [
  { pattern: /sal[aá]rio|pagamento mensal|folha/i, categoria: 'salario' },
  { pattern: /freelance|freela|projeto|consultoria/i, categoria: 'freelance' },
  { pattern: /aluguel|condom[ií]nio|iptu|moradia|financiamento/i, categoria: 'moradia' },
  { pattern: /super(mercado)?|ifood|mercado|padaria|restaurante|almo[cç]o|jantar/i, categoria: 'alimentacao' },
  { pattern: /uber|99|gasolina|combust[ií]vel|estacionamento|metro|ônibus|onibus|passagem/i, categoria: 'transporte' },
  { pattern: /farm[aá]cia|plano de sa[uú]de|consulta|m[eé]dico|dentista/i, categoria: 'saude' },
  { pattern: /curso|faculdade|mensalidade|livro|escola/i, categoria: 'educacao' },
  { pattern: /cinema|netflix|spotify|viagem|show|lazer/i, categoria: 'lazer' },
  { pattern: /internet|luz|energia|água|agua|telefone|celular|assinatura/i, categoria: 'servicos' },
  { pattern: /pix|ted|transfer[eê]ncia|poupan[cç]a/i, categoria: 'transferencias' },
  { pattern: /saque|atm|caixa/i, categoria: 'outros' },
];

export function sugerirCategoria(descricao: string): CategoriaTransacao | null {
  const texto = descricao.trim();
  if (!texto) return null;

  const match = CATEGORIA_KEYWORDS.find(item => item.pattern.test(texto));
  return match?.categoria ?? null;
}

export function labelCategoria(id: string | undefined | null, extras?: Record<string, string>): string {
  if (!id) return 'Outros';
  if (extras?.[id]) return extras[id];
  return CATEGORIA_LABELS[id] ?? id;
}

export function labelFormaPagamento(value: FormaPagamento | null | undefined): string {
  if (!value) return '—';
  return FORMA_PAGAMENTO_LABELS[value] ?? value;
}

export function isEntrada(tipo: TipoTransacao): boolean {
  return tipo === 'deposito';
}

export function calcularSaldo(transacoes: Transacao[]): number {
  return transacoes.reduce((saldo, transacao) => {
    return isEntrada(transacao.tipo) ? saldo + transacao.valor : saldo - transacao.valor;
  }, 0);
}

export function ordenarPorDataDesc(transacoes: Transacao[]): Transacao[] {
  return [...transacoes].sort((a, b) => {
    const byData = b.data.localeCompare(a.data);
    if (byData !== 0) return byData;
    return horaDe(b).localeCompare(horaDe(a));
  });
}

export function normalizarTransacao(transacao: Transacao): Transacao {
  return {
    ...transacao,
    hora: transacao.hora || '00:00:00',
    categoria: transacao.categoria ?? sugerirCategoria(transacao.descricao) ?? 'outros',
    formaPagamento: transacao.formaPagamento ?? null,
    anexoId: transacao.anexoId ?? null,
    anexo: transacao.anexo ?? null,
  };
}
