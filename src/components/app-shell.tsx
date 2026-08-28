import { Header } from '@/components/header';
import { NovaTransacaoFab } from '@/components/nova-transacao-fab';

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Header />
      <main
        id="main-content"
        className="mx-auto w-full max-w-7xl min-w-0 flex-1 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8"
      >
        {children}
      </main>
      <NovaTransacaoFab />
    </>
  );
}
