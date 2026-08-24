import { config as loadEnv } from 'dotenv';
import type { CapacitorConfig } from '@capacitor/cli';
import { resolve } from 'node:path';

loadEnv({ path: resolve(__dirname, '.env') });
loadEnv({ path: resolve(__dirname, '.env.local'), override: true });

const serverUrl = (process.env.CAPACITOR_SERVER_URL ?? '').trim().replace(/\/$/, '');

if (!serverUrl) {
  console.warn(
    '[mobile] CAPACITOR_SERVER_URL não definido — usando placeholder. Copie .env.example para .env.local.',
  );
}

const config: CapacitorConfig = {
  appId: 'br.com.fincontrol.app',
  appName: 'Pennywise',
  webDir: 'www',
  // Evita faixa preta no WebView (tema sage claro do host).
  backgroundColor: '#F5F7F0',
  server: {
    // Host Next.js em HTTPS (Vercel). O WebView não embute o Next — só abre esta URL.
    url: serverUrl || 'https://example.com',
    cleartext: false,
  },
  ios: {
    contentInset: 'never',
    preferredContentMode: 'mobile',
  },
  plugins: {
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#F5F7F0',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;
