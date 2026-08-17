import { Component } from '@angular/core';

import { TransacoesListComponent } from './transacoes-list.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TransacoesListComponent],
  template: `
    <main class="app">
      <mf-transacoes-list [apiUrl]="apiUrl" [usuarioId]="usuarioId" [accessToken]="accessToken" />
    </main>
  `,
  styles: `
    .app {
      max-width: 72rem;
      margin: 0 auto;
      padding: 1.5rem;
    }
  `,
})
export class AppComponent {
  apiUrl = 'http://localhost:3001';
  usuarioId = readCookie('fincontrol_uid') ?? '1';
  accessToken = readStoredAccessToken() ?? '';
}

function readCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function readStoredAccessToken(): string | undefined {
  try {
    const raw = localStorage.getItem('fincontrol:auth');
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { accessToken?: string | null };
    return parsed.accessToken ?? undefined;
  } catch {
    return undefined;
  }
}
