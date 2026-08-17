import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { StandaloneApp } from '@/standalone/standalone-app';
import '@/styles.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Elemento #root não encontrado');
}

createRoot(rootElement).render(
  <StrictMode>
    <StandaloneApp />
  </StrictMode>,
);
