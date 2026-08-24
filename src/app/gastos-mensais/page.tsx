import { GastosMensaisBoard } from '@/components/gastos-mensais-board';

export default function GastosMensaisPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <h1 className="fc-page-title">Gastos Mensais</h1>
        <p className="fc-card-subtitle">
          Contas que se repetem todo mês. Marque quando pagar: o lançamento entra nas transações.
        </p>
      </div>

      <GastosMensaisBoard />
    </div>
  );
}
