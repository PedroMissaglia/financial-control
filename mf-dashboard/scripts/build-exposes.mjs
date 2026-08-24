import { execSync } from 'node:child_process';

import { pruneStaleChunks } from './prune-stale-chunks.mjs';

execSync('npx vite build', {
  stdio: 'inherit',
  env: { ...process.env },
});

execSync('node scripts/generate-remote-entry.mjs', {
  stdio: 'inherit',
  env: { ...process.env },
});

pruneStaleChunks();
