import { AppShell } from '@/components/app-shell';
import { DashboardBoard } from '@/components/dashboard-board';

export default function HomePage() {
  return (
    <AppShell>
      <DashboardBoard transacoes={[]} />
    </AppShell>
  );
}
