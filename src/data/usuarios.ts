export interface Usuario {
  id: string;
  nome: string;
  email: string;
  senha: string;
}

export type UsuarioPublico = Omit<Usuario, 'senha'>;

export interface Credenciais {
  email: string;
  senha: string;
}

export const seedUsuarios: Usuario[] = [
  { id: '1', nome: 'Pedro Missaglia', email: 'pedromissaglia@gmail.com', senha: '123456' },
  { id: '2', nome: 'John Doe', email: 'John@fincontrol.com', senha: 'fincontrol' },
];

export function toUsuarioPublico(usuario: Usuario): UsuarioPublico {
  const { senha: _senha, ...publico } = usuario;
  return publico;
}

export function validarCredenciais(usuarios: Usuario[], email: string, senha: string): UsuarioPublico | undefined {
  const emailNormalizado = email.trim().toLowerCase();
  const usuario = usuarios.find(
    item => item.email.toLowerCase() === emailNormalizado && item.senha === senha
  );
  return usuario ? toUsuarioPublico(usuario) : undefined;
}
