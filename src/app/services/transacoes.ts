import type { NovaTransacao, Transacao } from '@/data/transacoes';
import { getTransacaoPorId, seedTransacoes } from '@/data/transacoes';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (!response.ok) {
    const message = await response.text();
    return { success: false, message: message || 'Erro na requisição' };
  }

  const data = (await response.json()) as T;
  return { success: true, data };
}

export async function fetchTransacoes(): Promise<ApiResponse<Transacao[]>> {
  try {
    const response = await fetch(`${API_URL}/transacoes`, { cache: 'no-store' });
    if (!response.ok) {
      return { success: true, data: seedTransacoes };
    }
    return handleResponse<Transacao[]>(response);
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    return { success: true, data: seedTransacoes };
  }
}

export async function fetchTransacaoById(id: string): Promise<ApiResponse<Transacao>> {
  try {
    const response = await fetch(`${API_URL}/transacoes/${id}`, { cache: 'no-store' });
    if (!response.ok) {
      const fallback = getTransacaoPorId(seedTransacoes, id);
      if (fallback) return { success: true, data: fallback };
      return { success: false, message: 'Transação não encontrada' };
    }
    return handleResponse<Transacao>(response);
  } catch (error) {
    console.error('Erro ao buscar transação:', error);
    const fallback = getTransacaoPorId(seedTransacoes, id);
    if (fallback) return { success: true, data: fallback };
    return { success: false, message: 'Não foi possível conectar à API' };
  }
}

export async function createTransacao(transacao: NovaTransacao): Promise<ApiResponse<Transacao>> {
  try {
    const response = await fetch(`${API_URL}/transacoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transacao),
    });
    return handleResponse<Transacao>(response);
  } catch (error) {
    console.error('Erro ao criar transação:', error);
    return { success: false, message: 'Não foi possível conectar à API' };
  }
}

export async function updateTransacao(id: string, transacao: NovaTransacao): Promise<ApiResponse<Transacao>> {
  try {
    const response = await fetch(`${API_URL}/transacoes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...transacao, id }),
    });
    return handleResponse<Transacao>(response);
  } catch (error) {
    console.error('Erro ao atualizar transação:', error);
    return { success: false, message: 'Não foi possível conectar à API' };
  }
}

export async function deleteTransacao(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await fetch(`${API_URL}/transacoes/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      return { success: false, message: 'Erro ao excluir transação' };
    }
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir transação:', error);
    return { success: false, message: 'Não foi possível conectar à API' };
  }
}

export async function getTransacoesOrThrow(): Promise<Transacao[]> {
  const result = await fetchTransacoes();
  if (!result.success || !result.data) {
    throw new Error(result.message ?? 'Erro ao carregar transações');
  }
  return result.data;
}

export async function getTransacaoOrThrow(id: string): Promise<Transacao> {
  const result = await fetchTransacaoById(id);
  if (!result.success || !result.data) {
    throw new Error(result.message ?? 'Transação não encontrada');
  }
  return result.data;
}
