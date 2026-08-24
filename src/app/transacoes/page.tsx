import { TransacoesMicrofrontend } from '@/components/transacoes-microfrontend';

export default function TransacoesPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="fc-page-title">Transações</h1>
        <p className="fc-card-subtitle mt-1">Visualize, edite ou exclua suas movimentações.</p>
      </div>

      <TransacoesMicrofrontend />
    </div>
  );
}
