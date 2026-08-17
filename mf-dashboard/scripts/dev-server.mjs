import { execSync, spawn } from 'node:child_process';
import { existsSync, watch } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const sharedContract = resolve(root, '../shared/dashboard-contract.ts');
const sharedDefaultLayout = resolve(root, '../shared/dashboard-default-layout.ts');
const remoteEntry = resolve(root, 'dist/remoteEntry.json');

let building = false;
let pending = false;
let debounceTimer;
let viteProcess;

function runBuildAllSync() {
  console.log('[mf-dashboard] building standalone + exposes (initial)...');
  execSync('npm run build', { cwd: root, stdio: 'inherit' });
  console.log('[mf-dashboard] initial build complete');
}

function runExposeBuildAsync() {
  if (building) {
    pending = true;
    return;
  }

  building = true;
  console.log('[mf-dashboard] rebuilding federation exposes...');

  const child = spawn('npm run build:exposes', {
    cwd: root,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      MF_CLEAN_DIST: '0',
    },
  });

  child.on('exit', code => {
    building = false;
    if (code === 0) {
      console.log('[mf-dashboard] expose rebuild complete');
    } else {
      console.error('[mf-dashboard] expose rebuild failed with code', code);
    }
    if (pending) {
      pending = false;
      scheduleExposeBuild(0);
    }
  });
}

function scheduleExposeBuild(delayMs = 500) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = undefined;
    runExposeBuildAsync();
  }, delayMs);
}

function startViteDev() {
  if (viteProcess) return;

  viteProcess = spawn(
    'npx',
    ['vite', '--config', 'vite.config.standalone.ts', '--port', '4300', '--strictPort', '--host', '127.0.0.1'],
    {
      cwd: root,
      stdio: 'inherit',
      shell: true,
    },
  );

  viteProcess.on('exit', code => {
    viteProcess = undefined;
    if (code != null && code !== 0) {
      process.exit(code);
    }
  });
}

function watchDir(path, label) {
  return watch(path, { recursive: true }, (_event, filename) => {
    if (!filename) return;
    if (filename.startsWith('standalone/')) return;
    console.log(`[mf-dashboard] change detected (${label}): ${filename}`);
    scheduleExposeBuild();
  });
}

function watchFile(path, label) {
  return watch(path, () => {
    console.log(`[mf-dashboard] change detected (${label})`);
    scheduleExposeBuild();
  });
}

if (existsSync(remoteEntry)) {
  startViteDev();
} else {
  runBuildAllSync();
  startViteDev();
}

watchDir(resolve(root, 'src'), 'src');
watchFile(sharedContract, 'shared/dashboard-contract.ts');
watchFile(sharedDefaultLayout, 'shared/dashboard-default-layout.ts');

process.on('SIGINT', () => {
  viteProcess?.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  viteProcess?.kill('SIGTERM');
  process.exit(0);
});
