import { DashboardBoard } from '@/components/dashboard-board';
import { Footer } from '@/components/footer';
import { Header } from '@/components/header';

export default function HomePage() {
  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto w-full max-w-7xl min-w-0 flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <DashboardBoard transacoes={[]} />
      </main>
      <Footer />
    </>
  );
}
