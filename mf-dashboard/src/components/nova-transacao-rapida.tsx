import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { agoraLocal, sugerirCategoria, TIPOS_TRANSACAO } from '@/data/transacoes';
import { authHeaders } from '@/lib/auth-token';

const MF_NAVIGATE = 'fincontrol:navigate';
const MF_TRANSACOES_CHANGED = 'fincontrol:transacoes-changed';

function getUsuarioIdFromCookie(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(/(?:^|; )fincontrol_uid=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function NovaTransacaoRapida() {
  const [tipo, setTipo] = useState<'deposito' | 'transferencia' | 'saque' | 'pagamento'>('deposito');
  const [valor, setValor] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const usuarioId = getUsuarioIdFromCookie();
    if (!usuarioId) {
      setError('Sessão expirada. Faça login novamente.');
      return;
    }
    if (valor <= 0) {
      setError('Informe um valor válido');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
    const descricao = `Nova ${TIPOS_TRANSACAO.find(item => item.value === tipo)?.label.toLowerCase()}`;
    const { data, hora } = agoraLocal();

    try {
      const response = await fetch(`${apiUrl}/transacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          usuarioId,
          tipo,
          valor,
          data,
          hora,
          descricao,
          categoria: sugerirCategoria(descricao) ?? (tipo === 'deposito' ? 'salario' : 'outros'),
        }),
      });

      if (!response.ok) {
        setError('Erro ao registrar transação');
        return;
      }

      setValor(0);
      window.dispatchEvent(new CustomEvent(MF_TRANSACOES_CHANGED));
    } catch {
      setError('Erro ao registrar transação');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova transação rápida</CardTitle>
        <CardDescription>Registre uma movimentação informando tipo e valor</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid grid-cols-12 gap-4">
          <div className="col-span-12 space-y-2 sm:col-span-6">
            <Label htmlFor="quick-tipo">Tipo</Label>
            <select
              id="quick-tipo"
              value={tipo}
              onChange={event => setTipo(event.target.value as typeof tipo)}
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              {TIPOS_TRANSACAO.map(item => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-12 space-y-2 sm:col-span-6">
            <Label htmlFor="quick-valor">Valor</Label>
            <CurrencyInput id="quick-valor" value={valor} onChange={setValor} />
          </div>

          <div className="col-span-12 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() =>
                window.dispatchEvent(new CustomEvent(MF_NAVIGATE, { detail: { href: '/transacoes/nova' } }))
              }
            >
              Formulário completo
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
              {isSubmitting ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        </form>

        {error && (
          <p className="text-destructive mt-3 text-sm" role="alert">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
