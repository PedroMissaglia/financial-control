import { ArrowDownLeft, ArrowUpRight, Banknote, CreditCard, Landmark } from 'lucide-react';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { isEntrada,TIPO_LABELS, type TipoTransacao } from '@/data/transacoes';
import { cn, formatCurrency, formatDateShort } from '@/lib/utils';

interface TransacaoCardProps {
  id: string;
  tipo: TipoTransacao;
  valor: number;
  data: string;
  descricao: string;
  compact?: boolean;
}

const iconMap = {
  deposito: Landmark,
  transferencia: ArrowUpRight,
  saque: Banknote,
  pagamento: CreditCard,
};

export function TransacaoCard({ id, tipo, valor, data, descricao, compact = false }: TransacaoCardProps) {
  const Icon = iconMap[tipo];
  const entrada = isEntrada(tipo);

  return (
    <Card className={cn('transition-shadow hover:shadow-md', compact && 'shadow-none')}>
      <CardContent className={cn('flex items-center gap-4', compact ? 'p-4' : 'p-5')}>
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
            entrada ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
          )}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <Link href={`/transacoes/${id}`} className="hover:text-primary font-medium hover:underline">
                {descricao}
              </Link>
              <p className="text-muted-foreground text-sm">{formatDateShort(data)}</p>
            </div>
            <p className={cn('font-semibold whitespace-nowrap', entrada ? 'text-success' : 'text-destructive')}>
              {entrada ? '+' : '-'}
              {formatCurrency(valor)}
            </p>
          </div>
          {!compact && (
            <Badge variant={entrada ? 'success' : 'secondary'} className="mt-2">
              {TIPO_LABELS[tipo]}
            </Badge>
          )}
        </div>

        {entrada ? (
          <ArrowDownLeft className="text-success hidden h-4 w-4 sm:block" aria-hidden="true" />
        ) : (
          <ArrowUpRight className="text-destructive hidden h-4 w-4 sm:block" aria-hidden="true" />
        )}
      </CardContent>
    </Card>
  );
}
