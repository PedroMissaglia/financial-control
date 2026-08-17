import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

console.log('[mf-dashboard] building standalone SPA...');
execSync('npx vite build -c vite.config.standalone.ts', {
  cwd: root,
  stdio: 'inherit',
});

console.log('[mf-dashboard] building federation exposes...');
execSync('npm run build:exposes', {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, MF_CLEAN_DIST: '0' },
});

console.log('[mf-dashboard] build complete');
