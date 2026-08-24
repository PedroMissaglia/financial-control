import type { Categoria } from '@/data/categorias';
import { apiFetch, readApiError } from '@/lib/api-client';
import { notifyCategoriasChanged } from '@/lib/mf-events';
import { appendUsuarioIds, fetchAllByUsuarioIds, normalizeUsuarioIds } from '@/lib/usuario-ids';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  status?: number;
}

function stampOwner(items: Categoria[], ownerId: string): Categoria[] {
  return items.map(item => (item.sistema ? item : { ...item, usuarioId: item.usuarioId ?? ownerId }));
}

export async function fetchCategorias(usuarioId?: string | string[]): Promise<ApiResponse<Categoria[]>> {
  const ids = normalizeUsuarioIds(usuarioId);
  if (ids.length === 0) {
    return { success: true, data: [] };
  }

  try {
    const search = new URLSearchParams();
    appendUsuarioIds(search, ids);
    const response = await apiFetch(`/categorias?${search.toString()}`);
    if (response.ok) {
      const data = (await response.json()) as Categoria[];
      const items = Array.isArray(data) ? data : [];
      return { success: true, data: ids.length === 1 ? stampOwner(items, ids[0]) : items };
    }

    if (ids.length > 1) {
      const merged = await fetchAllByUsuarioIds(ids, async id => {
        const one = await fetchCategorias(id);
        return one.data ?? [];
      }, lists => {
        const seen = new Set<string>();
        const out: Categoria[] = [];
        for (const list of lists) {
          for (const item of list) {
            if (seen.has(item.id)) continue;
            seen.add(item.id);
            out.push(item);
          }
        }
        return out;
      });
      return { success: true, data: merged };
    }

    return { success: false, message: await readApiError(response), status: response.status };
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
