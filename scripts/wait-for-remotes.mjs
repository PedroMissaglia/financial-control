const REMOTES = [
  {
    name: 'api',
    urls: ['http://localhost:3001/usuarios', 'http://[::1]:3001/usuarios', 'http://127.0.0.1:3001/usuarios'],
  },
  {
    name: 'mf-transacoes',
    urls: ['http://127.0.0.1:4200/remoteEntry.json', 'http://localhost:4200/remoteEntry.json'],
  },
  {
    name: 'mf-dashboard',
    urls: ['http://127.0.0.1:4300/remoteEntry.json', 'http://localhost:4300/remoteEntry.json'],
  },
];

const TIMEOUT_MS = 180_000;
const INTERVAL_MS = 1_000;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function isReady(url) {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    return response.ok;
  } catch {
    return false;
  }
}

async function isRemoteReady(remote) {
  for (const url of remote.urls) {
    if (await isReady(url)) return true;
  }
  return false;
}

async function main() {
  const deadline = Date.now() + TIMEOUT_MS;
  console.log('[host] aguardando remotes (max 3 min)...');

  while (Date.now() < deadline) {
    const checks = await Promise.all(
      REMOTES.map(async remote => ({
        name: remote.name,
        ready: await isRemoteReady(remote),
      })),
    );

    const pending = checks.filter(item => !item.ready);
    if (pending.length === 0) {
      console.log('[host] remotes prontos — subindo Next.js');
      return;
    }

    console.log(`[host] aguardando: ${pending.map(item => item.name).join(', ')}`);
    await sleep(INTERVAL_MS);
  }

  console.error('[host] timeout aguardando remotes:');
  for (const remote of REMOTES) {
    console.error(`  - ${remote.name}: ${remote.urls.join(' | ')}`);
  }
  process.exit(1);
}

void main();
