import { CategoriasBoard } from '@/components/categorias-board';

export default function CategoriasPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="space-y-1">
        <h1 className="fc-page-title">Categorias</h1>
        <p className="fc-card-subtitle">
          Crie categorias próprias para classificar transações. As padrão não podem ser alteradas.
        </p>
      </div>

      <CategoriasBoard />
    </div>
  );
}
