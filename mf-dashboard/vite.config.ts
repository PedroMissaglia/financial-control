import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

import { DASHBOARD_EXPOSES } from './scripts/exposes-config.mjs';

const libEntry = Object.fromEntries(
  DASHBOARD_EXPOSES.map(expose => [expose.name, resolve(__dirname, expose.input)]),
);

const reactExternals = [
  'react',
  'react-dom',
  'react-dom/client',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
];

export default defineConfig({
  plugins: [react({ fastRefresh: false }), tailwindcss()],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  preview: {
    port: 4300,
    host: '127.0.0.1',
    cors: true,
    strictPort: true,
  },
  build: {
    target: 'esnext',
    cssCodeSplit: false,
    outDir: 'dist',
    emptyOutDir: process.env.MF_CLEAN_DIST !== '0',
    lib: {
      entry: libEntry,
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: reactExternals,
      output: {
        chunkFileNames: chunkInfo => {
          const name = chunkInfo.name === 'styles' ? 'shared' : chunkInfo.name;
          return `chunks/${name}-[hash].js`;
        },
        assetFileNames: assetInfo => {
          if (assetInfo.name?.endsWith('.css')) return 'styles.css';
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});
