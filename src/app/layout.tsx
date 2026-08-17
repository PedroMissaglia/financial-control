import './globals.css';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';

import { AuthGuard } from '@/components/auth-guard';
import { AuthTokenRefresher } from '@/components/auth-token-refresher';
import { MfEventBridge } from '@/components/mf-event-bridge';
import { StoreProvider } from '@/store/provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Fin Control — Controle Financeiro',
  description: 'Gerencie suas transações financeiras de forma simples e organizada',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
  modal,
}: Readonly<{ children: React.ReactNode; modal: React.ReactNode }>) {
  return (
    <html lang="pt-BR" data-fin-theme="cyan">
      <body className={`${inter.variable} flex min-h-screen flex-col font-sans antialiased`}>
        <Script id="esms-options" strategy="beforeInteractive">
          {`window.esmsInitOptions = { shimMode: true };`}
        </Script>
        <Script src="/es-module-shims.js" strategy="beforeInteractive" />
        <StoreProvider>
          <MfEventBridge />
          <AuthTokenRefresher />
          <AuthGuard>
            <a href="#main-content" className="sr-only">
              Pular para o conteúdo principal
            </a>
            {children}
            {modal}
          </AuthGuard>
        </StoreProvider>
      </body>
    </html>
  );
}
