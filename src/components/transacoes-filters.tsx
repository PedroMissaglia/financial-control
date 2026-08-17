'use client';

import { FilterX, Search, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectMenu } from '@/components/ui/select-menu';
import {
  CATEGORIAS_FILTRO,
  chipsFiltros,
  contagemResultados,
  FILTROS_VAZIOS,
  removerFiltro,
  TIPOS_FILTRO,
  temFiltrosAtivos,
  type TransacoesFiltros,
} from '@/lib/transacao-filters';

interface TransacoesFiltersProps {
  filtros: TransacoesFiltros;
  total: number;
  visiveis: number;
  onChange: (filtros: TransacoesFiltros) => void;
}

export function TransacoesFilters({ filtros, total, visiveis, onChange }: Readonly<TransacoesFiltersProps>) {
  const ativos = temFiltrosAtivos(filtros);
  const resumo = contagemResultados(total, visiveis, filtros);
  const chips = chipsFiltros(filtros);

  function patch(partial: Partial<TransacoesFiltros>) {
    onChange({ ...filtros, ...partial });
  }

  function parseValor(value: string): number | null {
    if (!value.trim()) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return (
    <section className="bg-card mb-4 rounded-xl border p-4 shadow-sm" aria-label="Filtros de transações">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="fc-section-title">Filtros</h2>
          <p className="fc-caption">{resumo}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full shrink-0 gap-2 self-stretch sm:w-auto sm:self-start"
          disabled={!ativos}
          onClick={() => onChange(FILTROS_VAZIOS)}
        >
          <FilterX className="h-4 w-4" aria-hidden="true" />
          Limpar filtros
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="space-y-2 xl:col-span-6">
          <Label htmlFor="filtro-busca">Buscar</Label>
          <div className="relative">
            <Search
              className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
              aria-hidden="true"
            />
            <Input
              id="filtro-busca"
              type="search"
              placeholder="Descrição ou palavra-chave"
              className="ps-9"
              value={filtros.busca}
              onChange={event => patch({ busca: event.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filtro-tipo">Tipo</Label>
          <SelectMenu
            id="filtro-tipo"
            value={filtros.tipo}
            onChange={tipo => patch({ tipo })}
            options={TIPOS_FILTRO.map(item => ({ value: item.value, label: item.label }))}
            aria-label="Filtrar por tipo"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="filtro-categoria">Categoria</Label>
          <SelectMenu
            id="filtro-categoria"
            value={filtros.categoria}
            onChange={categoria => patch({ categoria })}
            options={CATEGORIAS_FILTRO.map(item => ({ value: item.value, label: item.label }))}
            aria-label="Filtrar por categoria"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="filtro-de">De</Label>
          <DatePicker
            id="filtro-de"
            value={filtros.dataInicio}
            max={filtros.dataFim || undefined}
            onChange={dataInicio => patch({ dataInicio })}
            aria-label="Data inicial"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="filtro-ate">Até</Label>
          <DatePicker
            id="filtro-ate"
            value={filtros.dataFim}
            min={filtros.dataInicio || undefined}
            align="end"
            onChange={dataFim => patch({ dataFim })}
            aria-label="Data final"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="filtro-min">Valor mín.</Label>
          <div className="relative">
            <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
              R$
            </span>
            <Input
              id="filtro-min"
              type="number"
              min={0}
              step="0.01"
              placeholder="0,00"
              className="ps-9"
              value={filtros.valorMin ?? ''}
              onChange={event => patch({ valorMin: parseValor(event.target.value) })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="filtro-max">Valor máx.</Label>
          <div className="relative">
            <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
              R$
            </span>
            <Input
              id="filtro-max"
              type="number"
              min={0}
              step="0.01"
              placeholder="0,00"
              className="ps-9"
              value={filtros.valorMax ?? ''}
              onChange={event => patch({ valorMax: parseValor(event.target.value) })}
            />
          </div>
        </div>
      </div>

      {ativos && (
        <div className="mt-4 flex flex-wrap gap-2 border-t pt-4" aria-label="Filtros ativos">
          {chips.map(chip => (
            <Badge key={chip.key} variant="secondary" className="gap-1 pr-1">
              {chip.label}
              <button
                type="button"
                className="hover:bg-background/60 rounded-full p-0.5"
                aria-label={`Remover filtro ${chip.label}`}
                onClick={() => onChange(removerFiltro(filtros, chip.key))}
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </section>
  );
}
