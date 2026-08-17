import { defaultProfile } from '@/data/dashboard-profile';
import type { NovoUsuario, Usuario, UsuarioPublico } from '@/data/usuarios';
import { toUsuarioPublico } from '@/data/usuarios';
import { apiFetch, readApiError } from '@/lib/api-client';
import { persistSession } from '@/lib/auth-session';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  usuario: UsuarioPublico;
}

export async function autenticar(email: string, senha: string): Promise<ApiResponse<UsuarioPublico>> {
  try {
    const response = await apiFetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), senha }),
      auth: false,
    });

    if (!response.ok) {
      return { success: false, message: await readApiError(response) };
    }

    const data = (await response.json()) as LoginResponse;
    persistSession(data.usuario, {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
    });
    return { success: true, data: data.usuario };
  } catch (error) {
    console.error('Erro ao autenticar:', error);
    return { success: false, message: 'Não foi possível conectar à API' };
  }
}

export async function criarUsuario(novo: NovoUsuario): Promise<ApiResponse<UsuarioPublico>> {
  const email = novo.email.trim().toLowerCase();

  try {
    const response = await apiFetch('/usuarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: novo.nome.trim(), email, senha: novo.senha }),
      auth: false,
    });

    if (!response.ok) {
      return { success: false, message: await readApiError(response) };
    }

    const criado = (await response.json()) as Usuario;
    const login = await autenticar(email, novo.senha);
    if (!login.success) {
      return { success: true, data: toUsuarioPublico(criado) };
    }

    await apiFetch('/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(defaultProfile(criado.id)),
    });

    return { success: true, data: login.data ?? toUsuarioPublico(criado) };
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return { success: false, message: 'Não foi possível conectar à API' };
  }
}
