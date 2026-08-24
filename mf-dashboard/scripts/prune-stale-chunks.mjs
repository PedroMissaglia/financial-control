import { existsSync, readdirSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

/**
 * After an expose rebuild with MF_CLEAN_DIST=0, remove chunk files that are no
 * longer referenced by DashboardView.js / DashboardEditor.js / other chunks.
 */
export function pruneStaleChunks(distDir = join(process.cwd(), 'dist')) {
  const chunksDir = join(distDir, 'chunks');
  if (!existsSync(chunksDir)) return;

  const entryFiles = ['DashboardView.js', 'DashboardEditor.js']
    .map(name => join(distDir, name))
    .filter(existsSync);

  const referenced = new Set();

  function collectFromSource(source) {
    for (const match of source.matchAll(/(?:chunks\/)?([A-Za-z0-9._-]+\.js)/g)) {
      const name = match[1];
      // Only track real chunk artifacts, not entry filenames.
      if (name === 'DashboardView.js' || name === 'DashboardEditor.js') continue;
      if (existsSync(join(chunksDir, name))) {
        referenced.add(name);
      }
    }
  }

  for (const file of entryFiles) {
    collectFromSource(readFileSync(file, 'utf8'));
  }

  // Follow chunk→chunk imports (shared → charts etc.) until fixed point.
  let growing = true;
  while (growing) {
    growing = false;
    for (const name of [...referenced]) {
      const path = join(chunksDir, name);
      if (!existsSync(path)) continue;
      const before = referenced.size;
      collectFromSource(readFileSync(path, 'utf8'));
      if (referenced.size > before) growing = true;
    }
  }

  let removed = 0;
  for (const file of readdirSync(chunksDir)) {
    if (!file.endsWith('.js')) continue;
    if (referenced.has(file)) continue;
    unlinkSync(join(chunksDir, file));
    removed += 1;
  }

  if (removed > 0) {
    console.log(`[mf-dashboard] pruned ${removed} stale chunk(s)`);
  }
}
