'use client';

import { Moon, Sun } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setThemeMode } from '@/store/slices/dashboard-slice';

export function ThemeModeToggle() {
  const dispatch = useAppDispatch();
  const themeMode = useAppSelector(state => state.dashboard.themeMode);
  const isDark = themeMode === 'dark';

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      aria-pressed={isDark}
      onClick={() => dispatch(setThemeMode(isDark ? 'light' : 'dark'))}
    >
      {isDark ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
    </Button>
  );
}
