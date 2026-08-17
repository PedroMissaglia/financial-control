export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha: string;
}

export type UsuarioPublico = Omit<Usuario, 'senha'>;

export type NovoUsuario = Omit<Usuario, 'id'>;

export interface Credenciais {
  email: string;
  senha: string;
}

export function toUsuarioPublico(usuario: Usuario): UsuarioPublico {
  return { id: usuario.id, nome: usuario.nome, email: usuario.email };
}

export function validarCredenciais(usuarios: Usuario[], email: string, senha: string): UsuarioPublico | undefined {
  const emailNormalizado = email.trim().toLowerCase();
  const usuario = usuarios.find(item => item.email.toLowerCase() === emailNormalizado && item.senha === senha);
  return usuario ? toUsuarioPublico(usuario) : undefined;
}
