import { execSync } from 'node:child_process';

execSync('npx vite build', {
  stdio: 'inherit',
  env: { ...process.env },
});
