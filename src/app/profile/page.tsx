import { cookies } from 'next/headers';

import { fetchTransacoes } from '@/app/services/transacoes';
import { ProfileBoard } from '@/components/profile-board';

export default async function ProfilePage() {
  const usuarioId = (await cookies()).get('fincontrol_uid')?.value;
  const result = await fetchTransacoes(usuarioId);
  const transacoes = result.data ?? [];

  return <ProfileBoard transacoes={transacoes} />;
}
