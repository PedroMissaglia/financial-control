import { DashboardViewApp } from '@/apps/dashboard-view-app';
import { resolveDashboardApiUrl } from '@/lib/api-url';
import { useStandaloneTransacoes } from '@/standalone/use-standalone-transacoes';
import { createDefaultDashboardLayout } from '../../../shared/dashboard-default-layout';

const DEFAULT_META_ECONOMIA = 800;
const DEFAULT_ALERTA_GASTOS = 2500;
const DEFAULT_EXTRATO_LIMITE = 10;

const defaultLayout = createDefaultDashboardLayout();

export function StandaloneApp() {
  const { transacoes } = useStandaloneTransacoes();

  return (
    <div className="bg-background text-foreground min-h-screen">
      <main className="mx-auto max-w-7xl px-4 py-6">
        <DashboardViewApp
          transacoes={transacoes}
          widgets={defaultLayout.widgets}
          layoutRows={defaultLayout.layoutRows}
          layoutGroups={defaultLayout.layoutGroups}
          metaEconomia={DEFAULT_META_ECONOMIA}
          alertaGastos={DEFAULT_ALERTA_GASTOS}
          extratoLimite={DEFAULT_EXTRATO_LIMITE}
          apiUrl={resolveDashboardApiUrl()}
        />
      </main>
    </div>
  );
}
