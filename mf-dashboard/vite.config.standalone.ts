import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

const root = resolve(__dirname);
const distDir = join(root, 'dist');

const federationAssets = [
  'remoteEntry.json',
  'DashboardView.js',
  'DashboardEditor.js',
  'styles.css',
] as const;

function federationDevAssetsPlugin(): Plugin {
  return {
    name: 'mf-dashboard-federation-dev-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? '';
        const pathname = url.replace(/^\/+/, '');
        const isFederationAsset = federationAssets.some(name => pathname === name);
        const isSharedChunk = pathname.startsWith('chunks/') && !pathname.includes('..');
        if (!isFederationAsset && !isSharedChunk) {
          next();
          return;
        }

        const filePath = join(distDir, pathname);

        void (async () => {
          const deadline = Date.now() + 12_000;
          while (!existsSync(filePath) && Date.now() < deadline) {
            await new Promise(resolveWait => setTimeout(resolveWait, 250));
          }

          if (!existsSync(filePath)) {
            res.statusCode = 404;
            res.end(`${pathname} ainda não foi gerado — aguarde o build dos exposes`);
            return;
          }

          const content = readFileSync(filePath);
          if (pathname.endsWith('.json')) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
          } else if (pathname.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
          } else {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
          }
          res.setHeader('Cache-Control', 'no-store');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(content);
        })();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), federationDevAssetsPlugin()],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
  },
  resolve: {
    alias: {
      '@': resolve(root, 'src'),
    },
  },
  server: {
    port: 4300,
    host: '127.0.0.1',
    strictPort: true,
    cors: true,
  },
  preview: {
    port: 4300,
    host: '127.0.0.1',
    strictPort: true,
    cors: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
  },
});
