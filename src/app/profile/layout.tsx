import { AppShell } from '@/components/app-shell';

export default function ProfileLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}
