import type { Categoria } from '@/data/categorias';
import { apiFetch, readApiError } from '@/lib/api-client';
import { notifyCategoriasChanged } from '@/lib/mf-events';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  status?: number;
}

export async function fetchCategorias(usuarioId?: string): Promise<ApiResponse<Categoria[]>> {
  if (!usuarioId) {
    return { success: true, data: [] };
  }

  try {
    const response = await apiFetch(`/categorias?usuarioId=${encodeURIComponent(usuarioId)}`);
    if (!response.ok) {
      return { success: false, message: await readApiError(response), status: response.status };
    }
    const data = (await response.json()) as Categoria[];
    return { success: true, data: Array.isArray(data) ? data : [] };
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    return { success: false, message: 'Não foi possível conectar à API', status: 0 };
  }
}

export async function createCategoria(usuarioId: string, nome: string): Promise<ApiResponse<Categoria>> {
  try {
    const response = await apiFetch('/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarioId, nome }),
    });
    if (!response.ok) {
      return { success: false, message: await readApiError(response), status: response.status };
    }
    const data = (await response.json()) as Categoria;
    notifyCategoriasChanged();
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    return { success: false, message: 'Não foi possível conectar à API', status: 0 };
  }
}

export async function updateCategoria(id: string, nome: string): Promise<ApiResponse<Categoria>> {
  try {
    const response = await apiFetch(`/categorias/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome }),
    });
    if (!response.ok) {
      return { success: false, message: await readApiError(response), status: response.status };
    }
    const data = (await response.json()) as Categoria;
    notifyCategoriasChanged();
    return { success: true, data };
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    return { success: false, message: 'Não foi possível conectar à API', status: 0 };
  }
}

export async function deleteCategoria(id: string): Promise<ApiResponse<void>> {
  try {
    const response = await apiFetch(`/categorias/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!response.ok) {
      return { success: false, message: await readApiError(response), status: response.status };
    }
    notifyCategoriasChanged();
    return { success: true };
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    return { success: false, message: 'Não foi possível conectar à API', status: 0 };
  }
}
