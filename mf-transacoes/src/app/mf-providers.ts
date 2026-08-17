import { EnvironmentProviders, Provider, provideExperimentalZonelessChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';

export const MF_PROVIDERS: Array<Provider | EnvironmentProviders> = [
  provideExperimentalZonelessChangeDetection(),
  provideAnimations(),
];

export function ensureMaterialFonts(): void {
  const fonts = [
    {
      key: 'mf-material-icons',
      href: 'https://fonts.googleapis.com/icon?family=Material+Icons',
    },
    {
      key: 'mf-roboto',
      href: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap',
    },
  ];

  for (const font of fonts) {
    if (document.querySelector(`link[data-mf-font="${font.key}"]`)) continue;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = font.href;
    link.dataset['mfFont'] = font.key;
    document.head.appendChild(link);
  }
}

const ISOLATION_STYLE_ID = 'mf-transacoes-host-isolation';

export function ensureHostIsolationStyles(): void {
  if (document.getElementById(ISOLATION_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = ISOLATION_STYLE_ID;
  style.textContent = `
    mf-transacoes-list .mat-mdc-button-persistent-ripple,
    mf-transacoes-list .mat-mdc-button-persistent-ripple::before,
    mf-transacoes-list .mat-mdc-button-ripple {
      position: absolute !important;
      inset: 0 !important;
      pointer-events: none !important;
      border-radius: inherit !important;
      background: transparent !important;
    }
    mf-transacoes-list .mat-mdc-button-persistent-ripple::before {
      content: "" !important;
      opacity: 0 !important;
      background-color: var(--mat-sys-primary) !important;
    }
    mf-transacoes-list .mat-mdc-button:hover > .mat-mdc-button-persistent-ripple::before,
    mf-transacoes-list .mat-mdc-icon-button:hover > .mat-mdc-button-persistent-ripple::before {
      opacity: 0.08 !important;
    }
    mf-transacoes-list .mat-mdc-button-touch-target {
      position: absolute !important;
      inset: auto 0 !important;
      top: 50% !important;
      height: 48px !important;
      transform: translateY(-50%) !important;
      background: transparent !important;
    }
    mf-transacoes-list .mdc-button__label {
      position: relative !important;
      z-index: 1 !important;
    }
    mf-transacoes-list svg {
      display: inline-block !important;
      max-width: none !important;
      vertical-align: middle !important;
    }
  `;
  document.head.appendChild(style);
}
