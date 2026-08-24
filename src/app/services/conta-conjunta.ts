import {
  CONTA_CONJUNTA_VAZIA,
  type ContaConjuntaView,
} from '@/data/conta-conjunta';
import { readStoredUsuario } from '@/lib/auth-session';
import { apiFetch, readApiError } from '@/lib/api-client';
import {
  mockAceitar,
  mockCancelar,
  mockConvidar,
  mockEncerrar,
  mockGetView,
  mockRecusar,
} from '@/lib/conta-conjunta-mock';
import type { UsuarioPublico } from '@/data/usuarios';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  status?: number;
}

let apiDisponivel: boolean | null = null;

function requireUsuario(): UsuarioPublico | null {
  return readStoredUsuario();
}

function parseView(json: unknown): ContaConjuntaView {
  if (!json || typeof json !== 'object') return CONTA_CONJUNTA_VAZIA;
  const raw = json as Partial<ContaConjuntaView>;
  const status = raw.status;
  if (
    status !== 'nenhuma' &&
    status !== 'convite_enviado' &&
    status !== 'convite_recebido' &&
    status !== 'ativa'
  ) {
    return CONTA_CONJUNTA_VAZIA;
  }
  return {
    status,
    parceiro: raw.parceiro ?? null,
    convite: raw.convite ?? null,
  };
}

async function handleViewResponse(response: Response): Promise<ApiResponse<ContaConjuntaView>> {
  if (response.status === 404) {
    apiDisponivel = false;
    return { success: false, status: 404, message: 'not-found' };
  }
  if (!response.ok) {
    apiDisponivel = true;
    return { success: false, status: response.status, message: await readApiError(response) };
  }
  apiDisponivel = true;
  return { success: true, data: parseView(await response.json()), status: response.status };
}

async function listarUsuarios(): Promise<UsuarioPublico[]> {
  const response = await apiFetch('/usuarios');
  if (!response.ok) return [];
  const json: unknown = await response.json();
  if (!Array.isArray(json)) return [];
  return json.filter((item): item is UsuarioPublico => {
    return !!item && typeof item === 'object' && typeof (item as UsuarioPublico).id === 'string';
  });
}

function mockResult(
  result: { ok: true; data: ContaConjuntaView } | { ok: false; message: string },
): ApiResponse<ContaConjuntaView> {
  if (!result.ok) return { success: false, message: result.message };
  return { success: true, data: result.data };
}

export async function fetchContaConjunta(): Promise<ApiResponse<ContaConjuntaView>> {
  const usuario = requireUsuario();
  if (!usuario) return { success: true, data: CONTA_CONJUNTA_VAZIA };

  if (apiDisponivel !== false) {
    try {
      const response = await apiFetch('/contas-conjuntas');
      const result = await handleViewResponse(response);
      if (result.success || result.status !== 404) return result;
    } catch {
      apiDisponivel = false;
    }
  }

  return { success: true, data: mockGetView(usuario) };
}

export async function enviarConvite(email: string): Promise<ApiResponse<ContaConjuntaView>> {
  const usuario = requireUsuario();
  if (!usuario) return { success: false, message: 'Sessão expirada. Faça login novamente.' };

  if (apiDisponivel !== false) {
    try {
      const response = await apiFetch('/contas-conjuntas/convites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const result = await handleViewResponse(response);
      if (result.success || result.status !== 404) return result;
    } catch {
      apiDisponivel = false;
    }
  }

  const usuarios = await listarUsuarios();
  const convidado = usuarios.find(item => item.email.trim().toLowerCase() === email.trim().toLowerCase());
  if (!convidado) {
    return { success: false, message: 'Não encontramos uma conta com este e-mail' };
  }
  return mockResult(mockConvidar(usuario, convidado));
}

export async function aceitarConvite(id: string): Promise<ApiResponse<ContaConjuntaView>> {
  const usuario = requireUsuario();
  if (!usuario) return { success: false, message: 'Sessão expirada. Faça login novamente.' };

  if (apiDisponivel !== false) {
    try {
      const response = await apiFetch(`/contas-conjuntas/convites/${encodeURIComponent(id)}/aceitar`, {
        method: 'POST',
      });
      const result = await handleViewResponse(response);
      if (result.success || result.status !== 404) return result;
    } catch {
      apiDisponivel = false;
    }
  }

  return mockResult(mockAceitar(usuario, id));
}

export async function recusarConvite(id: string): Promise<ApiResponse<ContaConjuntaView>> {
  const usuario = requireUsuario();
  if (!usuario) return { success: false, message: 'Sessão expirada. Faça login novamente.' };

  if (apiDisponivel !== false) {
    try {
      const response = await apiFetch(`/contas-conjuntas/convites/${encodeURIComponent(id)}/recusar`, {
        method: 'POST',
      });
      const result = await handleViewResponse(response);
      if (result.success || result.status !== 404) return result;
    } catch {
      apiDisponivel = false;
    }
  }

  return mockResult(mockRecusar(usuario, id));
}

export async function cancelarConvite(id: string): Promise<ApiResponse<ContaConjuntaView>> {
  const usuario = requireUsuario();
  if (!usuario) return { success: false, message: 'Sessão expirada. Faça login novamente.' };

  if (apiDisponivel !== false) {
    try {
      const response = await apiFetch(`/contas-conjuntas/convites/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      const result = await handleViewResponse(response);
      if (result.success || result.status !== 404) return result;
    } catch {
      apiDisponivel = false;
    }
  }

  return mockResult(mockCancelar(usuario, id));
}

export async function encerrarContaConjunta(): Promise<ApiResponse<ContaConjuntaView>> {
  const usuario = requireUsuario();
  if (!usuario) return { success: false, message: 'Sessão expirada. Faça login novamente.' };

  if (apiDisponivel !== false) {
    try {
      const response = await apiFetch('/contas-conjuntas', { method: 'DELETE' });
      const result = await handleViewResponse(response);
      if (result.success || result.status !== 404) return result;
    } catch {
      apiDisponivel = false;
    }
  }

  return mockResult(mockEncerrar(usuario));
}
