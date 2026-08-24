'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';

import { createCategoria, deleteCategoria, updateCategoria } from '@/app/services/categorias';
import { EntityListRow } from '@/components/entity-list-row';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Categoria } from '@/data/categorias';
import { useCategorias } from '@/lib/use-categorias';
import { useAuth } from '@/store/hooks';

export function CategoriasBoard() {
  const { usuario } = useAuth();
  const { categorias, loading, reload } = useCategorias(usuario?.id);
  const [nome, setNome] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const padrao = categorias.filter(item => item.sistema);
  const minhas = categorias.filter(item => !item.sistema);

  async function handleCreate() {
    const trimmed = nome.trim();
    if (!trimmed || !usuario?.id) return;

    setBusy(true);
    setError(null);
    const result = await createCategoria(usuario.id, trimmed);
    setBusy(false);

    if (!result.success) {
      setError(result.message ?? 'Não foi possível criar a categoria');
      return;
    }

    setNome('');
    await reload();
  }

  async function handleRename(categoria: Categoria) {
    const trimmed = editNome.trim();
    if (!trimmed || trimmed === categoria.nome) {
      setEditingId(null);
      return;
    }

    setBusy(true);
    setError(null);
    const result = await updateCategoria(categoria.id, trimmed);
    setBusy(false);

    if (!result.success) {
      setError(result.message ?? 'Não foi possível renomear a categoria');
      return;
    }

    setEditingId(null);
    await reload();
  }

  async function handleDelete(categoria: Categoria) {
    setBusy(true);
    setError(null);
    const result = await deleteCategoria(categoria.id);
    setBusy(false);

    if (!result.success) {
      setError(result.message ?? 'Não foi possível excluir a categoria');
      return;
    }

    if (editingId === categoria.id) setEditingId(null);
    await reload();
  }

  function renderMinhas() {
    if (loading && minhas.length === 0) {
      return <p className="text-muted-foreground text-sm">Carregando categorias...</p>;
    }
    if (minhas.length === 0) {
      return <p className="text-muted-foreground text-sm">Você ainda não criou categorias personalizadas.</p>;
    }
    return (
      <ul className="divide-border divide-y rounded-lg border">
        {minhas.map(item => (
          <li
            key={item.id}
            className={
              editingId === item.id
                ? 'flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center'
                : 'px-3 py-2'
            }
          >
            {editingId === item.id ? (
              <>
                <Input
                  value={editNome}
                  maxLength={40}
                  aria-label={`Renomear ${item.nome}`}
                  className="min-w-0 w-full sm:flex-1"
                  onChange={event => setEditNome(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void handleRename(item);
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button type="button" size="sm" className="flex-1 sm:flex-none" disabled={busy} onClick={() => void handleRename(item)}>
                    Salvar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="flex-1 sm:flex-none"
                    disabled={busy}
                    onClick={() => setEditingId(null)}
                  >
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <EntityListRow
                title={item.nome}
                editLabel={`Renomear ${item.nome}`}
                deleteLabel={`Excluir ${item.nome}`}
                disabled={busy}
                onEdit={() => {
                  setEditingId(item.id);
                  setEditNome(item.nome);
                  setError(null);
                }}
                onDelete={() => void handleDelete(item)}
              />
            )}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className="bg-card space-y-4 rounded-xl border p-4 shadow-sm sm:p-6" aria-label="Minhas categorias">
      {padrao.length > 0 && (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Padrão</p>
          <ul className="flex flex-wrap gap-1.5 sm:gap-2">
            {padrao.map(item => (
              <li
                key={item.id}
                className="bg-muted rounded-full px-2 py-0.5 text-xs sm:px-3 sm:py-1 sm:text-sm"
              >
                {item.nome}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="nova-categoria">Nova categoria</Label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="nova-categoria"
            value={nome}
            maxLength={40}
            placeholder="Ex: Pets, Assinaturas..."
            onChange={event => setNome(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void handleCreate();
              }
            }}
          />
          <Button
            type="button"
            className="gap-1.5 sm:w-auto"
            disabled={busy || loading || !nome.trim()}
            onClick={() => void handleCreate()}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Criar
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      )}

      {renderMinhas()}
    </section>
  );
}
