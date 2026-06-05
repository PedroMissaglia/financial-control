export type TipoTransacao = 'deposito' | 'transferencia' | 'saque' | 'pagamento';

export interface Transacao {
  id: string;
  tipo: TipoTransacao;
  valor: number;
  data: string;
  descricao: string;
}

export interface NovaTransacao {
  tipo: TipoTransacao;
  valor: number;
  data: string;
  descricao: string;
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

export function isEntrada(tipo: TipoTransacao): boolean {
  return tipo === 'deposito';
}

export function calcularSaldo(transacoes: Transacao[]): number {
  return transacoes.reduce((saldo, transacao) => {
    return isEntrada(transacao.tipo) ? saldo + transacao.valor : saldo - transacao.valor;
  }, 0);
}

export function getUltimasTransacoes(transacoes: Transacao[], limit = 5): Transacao[] {
  return [...transacoes]
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, limit);
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
  return [...transacoes].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
}

export const seedTransacoes: Transacao[] = [
  { id: '1', tipo: 'deposito', valor: 3500, data: '2026-06-01', descricao: 'Salário' },
  { id: '2', tipo: 'pagamento', valor: 1200, data: '2026-06-02', descricao: 'Aluguel' },
  { id: '3', tipo: 'transferencia', valor: 350, data: '2026-06-03', descricao: 'Transferência para poupança' },
  { id: '4', tipo: 'saque', valor: 200, data: '2026-06-03', descricao: 'Saque ATM' },
  { id: '5', tipo: 'deposito', valor: 800, data: '2026-05-28', descricao: 'Freelance' },
  { id: '6', tipo: 'pagamento', valor: 89.9, data: '2026-05-27', descricao: 'Internet' },
  { id: '7', tipo: 'pagamento', valor: 450, data: '2026-05-25', descricao: 'Supermercado' },
  { id: '8', tipo: 'transferencia', valor: 150, data: '2026-05-20', descricao: 'Pix para João' },
];
