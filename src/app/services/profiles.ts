import { defaultProfile, mergeProfile, type DashboardProfile } from '@/data/dashboard-profile';
import { apiFetch } from '@/lib/api-client';

export async function fetchProfile(usuarioId: string): Promise<DashboardProfile> {
  try {
    const response = await apiFetch(`/profiles/${encodeURIComponent(usuarioId)}`);
    if (response.ok) {
      return mergeProfile((await response.json()) as DashboardProfile, usuarioId);
    }

    if (response.status === 404) {
      const created = defaultProfile(usuarioId);
      await saveProfile(created);
      return created;
    }
  } catch (error) {
    console.error('Erro ao buscar profile:', error);
  }

  return defaultProfile(usuarioId);
}

export async function saveProfile(profile: DashboardProfile): Promise<void> {
  const payload = mergeProfile(profile, profile.usuarioId);
  try {
    const response = await apiFetch(`/profiles/${encodeURIComponent(payload.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) return;

    await apiFetch('/profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Erro ao salvar profile:', error);
  }
}

/** Atualiza só o bloco de notas (próprio ou do cônjuge com parceria ativa). */
export async function saveBlocoNotas(usuarioId: string, blocoNotas: string): Promise<void> {
  try {
    await apiFetch(`/profiles/${encodeURIComponent(usuarioId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: usuarioId,
        usuarioId,
        blocoNotas,
      }),
    });
  } catch (error) {
    console.error('Erro ao salvar bloco de notas:', error);
  }
}
