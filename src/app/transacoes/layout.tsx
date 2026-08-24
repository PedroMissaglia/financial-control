import { AppShell } from '@/components/app-shell';

export default function TransacoesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}
