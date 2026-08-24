export function normalizeUsuarioIds(ids?: string | string[] | null): string[] {
  if (!ids) return [];
  const list = Array.isArray(ids) ? ids : [ids];
  return [...new Set(list.map(id => id.trim()).filter(Boolean))];
}

export function appendUsuarioIds(search: URLSearchParams, usuarioIds: string[]) {
  if (usuarioIds.length === 0) return;
  search.set('usuarioId', usuarioIds[0]);
  if (usuarioIds.length > 1) {
    search.set('usuarioIds', usuarioIds.join(','));
  }
}

export async function fetchAllByUsuarioIds<T>(
  usuarioIds: string[],
  fetchOne: (usuarioId: string) => Promise<T[]>,
  merge: (lists: T[][]) => T[] = lists => lists.flat(),
): Promise<T[]> {
  const ids = normalizeUsuarioIds(usuarioIds);
  if (ids.length === 0) return [];
  if (ids.length === 1) return fetchOne(ids[0]);
  const lists = await Promise.all(ids.map(id => fetchOne(id)));
  return merge(lists);
}
