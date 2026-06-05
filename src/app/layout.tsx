import './globals.css';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { AuthGuard } from '@/components/auth-guard';
import { AuthProvider } from '@/contexts/auth-context';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Fin Control — Controle Financeiro',
  description: 'Gerencie suas transações financeiras de forma simples e organizada',
};

export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
  modal,
}: Readonly<{ children: React.ReactNode; modal: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} flex min-h-screen flex-col font-sans antialiased`}>
        <AuthProvider>
          <AuthGuard>
            {children}
            {modal}
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
