export interface Categoria {
  id: string;
  nome: string;
  sistema: boolean;
  usuarioId?: string;
}

export function categoriasToLabels(categorias: Categoria[]): Record<string, string> {
  return Object.fromEntries(categorias.map(item => [item.id, item.nome]));
}
