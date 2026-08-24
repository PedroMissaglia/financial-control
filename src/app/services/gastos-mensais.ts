import type { GastoMensal, GastoMensalInput } from '@/data/gastos-mensais';
import { apiFetch, readApiError } from '@/lib/api-client';
import { notifyTransacoesChanged } from '@/lib/mf-events';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  status?: number;
}

export async function fetchGastosMensais(
  usuarioId: string,
  competencia: string,
): Promise<ApiResponse<GastoMensal[]>> {
  try {
    const search = new URLSearchParams({ usuarioId, competencia });
    const response = await apiFetch(`/gastos-mensais?${search.toString()}`);
    if (!response.ok) {
      return { success: false, message: await readApiError(response), status: response.status };
    }
    const data = (await response.json()) as GastoMensal[];
    return { success: true, data: Array.isArray(data) ? data : [] };
  } catch (error) {
    console.error('Erro ao buscar gastos mensais:', error);
    return { success: false, message: 'Não foi possível conectar à API', status: 0 };
  }
}

export async function createGastoMensal(
  usuarioId: string,
  input: GastoMensalInput,
): Promise<ApiResponse<GastoMensal>> {
  try {
    const response = await apiFetch('/gastos-mensais', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarioId, ...input }),
    });
    if (!response.ok) {
      return { success: false, message: await readApiError(response), status: response.status };
    }
    const data = (await response.json()) as GastoMensal;
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao criar gasto mensal:', error);
    return { success: false, message: 'Não foi possível conectar à API', status: 0 };
  }
}

export async function updateGastoMensal(
  id: string,
  input: GastoMensalInput,
): Promise<ApiResponse<GastoMensal>> {
  try {
    const response = await apiFetch(`/gastos-mensais/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    if (!response.ok) {
      return { success: false, message: await readApiError(response), status: response.status };
    }
    const data = (await response.json()) as GastoMensal;
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao atualizar gasto mensal:', error);
    return { success: false, message: 'Não foi possível conectar à API', status: 0 };
  }
}

export async function deleteGastoMensal(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await apiFetch(`/gastos-mensais/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!response.ok) {
      return { success: false, message: await readApiError(response), status: response.status };
    }
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir gasto mensal:', error);
    return { success: false, message: 'Não foi possível conectar à API', status: 0 };
  }
}

export async function pagarGastoMensal(
  id: string,
  competencia: string,
): Promise<ApiResponse<GastoMensal>> {
  try {
    const response = await apiFetch(`/gastos-mensais/${encodeURIComponent(id)}/pagamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ competencia }),
    });
    if (!response.ok) {
      return { success: false, message: await readApiError(response), status: response.status };
    }
    const data = (await response.json()) as GastoMensal;
    notifyTransacoesChanged();
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao marcar gasto mensal como pago:', error);
    return { success: false, message: 'Não foi possível conectar à API', status: 0 };
  }
}

export async function desmarcarGastoMensal(id: string, competencia: string): Promise<ApiResponse<void>> {
  try {
    const search = new URLSearchParams({ competencia });
    const response = await apiFetch(
      `/gastos-mensais/${encodeURIComponent(id)}/pagamentos?${search.toString()}`,
      { method: 'DELETE' },
    );
    if (!response.ok) {
      return { success: false, message: await readApiError(response), status: response.status };
    }
    notifyTransacoesChanged();
    return { success: true };
  } catch (error) {
    console.error('Erro ao desmarcar gasto mensal:', error);
    return { success: false, message: 'Não foi possível conectar à API', status: 0 };
  }
}
