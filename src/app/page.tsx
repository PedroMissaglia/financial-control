import Link from 'next/link';

import { getTransacoesOrThrow } from '@/app/services/transacoes';
import { ExtratoRecente } from '@/components/extrato-recente';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { NovaTransacaoRapida } from '@/components/nova-transacao-rapida';
import { SaldoCard } from '@/components/saldo-card';
import { Button } from '@/components/ui/button';
import { calcularSaldo, getUltimasTransacoes } from '@/data/transacoes';

export default async function HomePage() {
  const transacoes = await getTransacoesOrThrow();
  const saldo = calcularSaldo(transacoes);
  const recentes = getUltimasTransacoes(transacoes, 5);

  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Bem-vindo ao Fin Control</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-lg">
            Gerencie suas finanças pessoais com clareza. Acompanhe seu saldo, visualize o extrato e registre novas
            transações em poucos cliques.
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <SaldoCard saldo={saldo} />
          <NovaTransacaoRapida />
        </div>

        <section className="mt-8">
          <ExtratoRecente transacoes={recentes} />
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/transacoes">
            <Button variant="outline">Ver todas as transações</Button>
          </Link>
          <Link href="/transacoes/nova">
            <Button>Nova transação</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
