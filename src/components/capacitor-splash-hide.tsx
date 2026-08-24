'use client';

import { useEffect } from 'react';

type CapacitorBridge = {
  isNativePlatform?: () => boolean;
  Plugins?: {
    SplashScreen?: {
      hide: () => Promise<void>;
    };
  };
};

declare global {
  interface Window {
    Capacitor?: CapacitorBridge;
  }
}

/**
 * No WebView Capacitor, mantém a splash nativa até o host Next hidratar
 * (evita tela preta enquanto a URL da Vercel carrega).
 */
export function CapacitorSplashHide() {
  useEffect(() => {
    const capacitor = window.Capacitor;
    if (!capacitor?.isNativePlatform?.()) return;

    const hide = () => {
      void capacitor.Plugins?.SplashScreen?.hide()?.catch(() => {
        /* plugin ausente ou splash já ocultada */
      });
    };

    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(hide);
    });

    const onLoad = () => hide();
    if (document.readyState === 'complete') {
      hide();
    } else {
      window.addEventListener('load', onLoad, { once: true });
    }

    // Fallback: não prender a splash se a página demorar demais
    const timeout = window.setTimeout(hide, 8000);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('load', onLoad);
      window.clearTimeout(timeout);
    };
  }, []);

  return null;
}
