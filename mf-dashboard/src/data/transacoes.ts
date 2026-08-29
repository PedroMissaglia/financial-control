export type TipoTransacao = 'deposito' | 'rendimentos' | 'transferencia' | 'saque' | 'pagamento';

export type FormaPagamento = 'credito' | 'debito' | 'pix' | 'vr_va';

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
  { value: 'rendimentos', label: 'Rendimentos' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'saque', label: 'Saque' },
  { value: 'pagamento', label: 'Pagamento' },
];

export const TIPO_LABELS: Record<TipoTransacao, string> = {
  deposito: 'Depósito',
  rendimentos: 'Rendimentos',
  transferencia: 'Transferência',
  saque: 'Saque',
  pagamento: 'Pagamento',
};

export const FORMAS_PAGAMENTO: { value: FormaPagamento; label: string }[] = [
  { value: 'pix', label: 'Pix' },
  { value: 'credito', label: 'Crédito' },
  { value: 'debito', label: 'Débito' },
  { value: 'vr_va', label: 'VR/VA' },
];

export const FORMA_PAGAMENTO_LABELS: Record<FormaPagamento, string> = {
  pix: 'Pix',
  credito: 'Crédito',
  debito: 'Débito',
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

export function isEntrada(tipo: TipoTransacao): boolean {
  return tipo === 'deposito' || tipo === 'rendimentos';
}

export function calcularSaldo(transacoes: Transacao[]): number {
  return transacoes.reduce((saldo, transacao) => {
    return isEntrada(transacao.tipo) ? saldo + transacao.valor : saldo - transacao.valor;
  }, 0);
}

export function getUltimasTransacoes(transacoes: Transacao[], limit = 5): Transacao[] {
  return transacoes
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const byData = b.item.data.localeCompare(a.item.data);
      if (byData !== 0) return byData;
      const byHora = horaDe(b.item).localeCompare(horaDe(a.item));
      if (byHora !== 0) return byHora;
      return b.index - a.index;
    })
    .slice(0, limit)
    .map(entry => entry.item);
}

export function getTransacaoPorId(transacoes: Transacao[], id: string): Transacao | undefined {
  return transacoes.find(transacao => transacao.id === id);
}

export function filtrarPorTipo(transacoes: Transacao[], tipo: TipoTransacao): Transacao[] {
  return transacoes.filter(transacao => transacao.tipo === tipo);
}

export function filtrarPorPeriodo(transacoes: Transacao[], inicio: string, fim: string): Transacao[] {
  const inicioDate = new Date(`${inicio}T00:00:00`);
  const fimDate = new Date(`${fim}T23:59:59`);

  return transacoes.filter(transacao => {
    const data = new Date(`${transacao.data}T12:00:00`);
    return data >= inicioDate && data <= fimDate;
  });
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

export const seedTransacoes: Transacao[] = [
  { id: '1', usuarioId: '1', tipo: 'deposito', valor: 3500, data: '2026-06-01', hora: '00:00:00', descricao: 'Salário', categoria: 'salario' },
  { id: '2', usuarioId: '1', tipo: 'pagamento', valor: 1200, data: '2026-06-02', hora: '00:00:00', descricao: 'Aluguel', categoria: 'moradia' },
  {
    id: '3',
    usuarioId: '1',
    tipo: 'transferencia',
    valor: 350,
    data: '2026-06-03',
    hora: '00:00:00',
    descricao: 'Transferência para poupança',
    categoria: 'transferencias',
  },
  { id: '4', usuarioId: '1', tipo: 'saque', valor: 200, data: '2026-06-03', hora: '00:00:00', descricao: 'Saque ATM', categoria: 'outros' },
  { id: '5', usuarioId: '1', tipo: 'deposito', valor: 800, data: '2026-05-28', hora: '00:00:00', descricao: 'Freelance', categoria: 'freelance' },
  { id: '6', usuarioId: '1', tipo: 'pagamento', valor: 89.9, data: '2026-05-27', hora: '00:00:00', descricao: 'Internet', categoria: 'servicos' },
  { id: '7', usuarioId: '1', tipo: 'pagamento', valor: 450, data: '2026-05-25', hora: '00:00:00', descricao: 'Supermercado', categoria: 'alimentacao' },
  { id: '8', usuarioId: '1', tipo: 'transferencia', valor: 150, data: '2026-05-20', hora: '00:00:00', descricao: 'Pix para João', categoria: 'transferencias' },
  { id: '9', usuarioId: '1', tipo: 'pagamento', valor: 62.5, data: '2026-06-04', hora: '00:00:00', descricao: 'Uber', categoria: 'transporte' },
  { id: '10', usuarioId: '1', tipo: 'pagamento', valor: 39.9, data: '2026-06-05', hora: '00:00:00', descricao: 'Spotify', categoria: 'lazer' },
  { id: '11', usuarioId: '1', tipo: 'pagamento', valor: 180, data: '2026-06-06', hora: '00:00:00', descricao: 'Farmácia', categoria: 'saude' },
  { id: '12', usuarioId: '1', tipo: 'deposito', valor: 420, data: '2026-06-07', hora: '00:00:00', descricao: 'Freelance projeto app', categoria: 'freelance' },
  { id: '13', usuarioId: '1', tipo: 'pagamento', valor: 95, data: '2026-06-08', hora: '00:00:00', descricao: 'Supermercado', categoria: 'alimentacao' },
  { id: '14', usuarioId: '1', tipo: 'pagamento', valor: 220, data: '2026-06-09', hora: '00:00:00', descricao: 'Curso online', categoria: 'educacao' },
  { id: '15', usuarioId: '1', tipo: 'pagamento', valor: 55, data: '2026-06-10', hora: '00:00:00', descricao: 'Cinema', categoria: 'lazer' },
];
