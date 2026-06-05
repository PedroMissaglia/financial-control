import type { Usuario, UsuarioPublico } from '@/data/usuarios';
import { seedUsuarios, validarCredenciais } from '@/data/usuarios';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

async function carregarUsuarios(): Promise<Usuario[]> {
  try {
    const response = await fetch(`${API_URL}/usuarios`, { cache: 'no-store' });
    if (!response.ok) {
      return seedUsuarios;
    }
    return (await response.json()) as Usuario[];
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return seedUsuarios;
  }
}

export async function autenticar(email: string, senha: string): Promise<ApiResponse<UsuarioPublico>> {
  const usuarios = await carregarUsuarios();
  const usuario = validarCredenciais(usuarios, email, senha);

  if (!usuario) {
    return { success: false, message: 'E-mail ou senha inválidos' };
  }

  return { success: true, data: usuario };
}
