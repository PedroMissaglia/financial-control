import type { NovoUsuario, Usuario, UsuarioPublico } from '@/data/usuarios';
import { seedUsuarios, toUsuarioPublico, validarCredenciais } from '@/data/usuarios';

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

export async function criarUsuario(novo: NovoUsuario): Promise<ApiResponse<UsuarioPublico>> {
  const email = novo.email.trim().toLowerCase();

  try {
    const usuarios = await carregarUsuarios();
    if (usuarios.some(usuario => usuario.email.toLowerCase() === email)) {
      return { success: false, message: 'Este e-mail já está cadastrado' };
    }

    const response = await fetch(`${API_URL}/usuarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: novo.nome.trim(), email, senha: novo.senha }),
    });

    if (!response.ok) {
      return { success: false, message: 'Não foi possível criar a conta' };
    }

    const criado = (await response.json()) as Usuario;
    return { success: true, data: toUsuarioPublico(criado) };
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return { success: false, message: 'Não foi possível conectar à API' };
  }
}
