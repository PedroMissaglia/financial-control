import { execSync } from 'node:child_process';

const FRONT_PORTS = [3000, 4200, 4300];

function run(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
}

function pidsOnWindows(port) {
  const output = run('netstat -ano');
  const pids = new Set();

  for (const line of output.split(/\r?\n/)) {
    if (!line.includes('LISTENING')) continue;
    if (!line.includes(`:${port} `) && !line.endsWith(`:${port}`)) continue;
    const pid = line.trim().split(/\s+/).at(-1);
    if (pid && /^\d+$/.test(pid) && pid !== '0') pids.add(pid);
  }

  return [...pids];
}

function pidsOnUnix(port) {
  const output = run(`lsof -ti tcp:${port} -sTCP:LISTEN`);
  return output
    .split(/\s+/)
    .map(pid => pid.trim())
    .filter(pid => /^\d+$/.test(pid));
}

function killPid(pid) {
  if (process.platform === 'win32') {
    run(`taskkill /PID ${pid} /T /F`);
    return;
  }
  run(`kill -9 ${pid}`);
}

const listPids = process.platform === 'win32' ? pidsOnWindows : pidsOnUnix;
const killed = new Set();

for (const port of FRONT_PORTS) {
  const pids = listPids(port);
  if (pids.length === 0) {
    console.log(`[kill-front] ${port} livre`);
    continue;
  }

  for (const pid of pids) {
    if (killed.has(pid)) continue;
    killPid(pid);
    killed.add(pid);
    console.log(`[kill-front] ${port} — encerrou PID ${pid}`);
  }
}

if (killed.size === 0) {
  console.log('[kill-front] nada escutando em 3000, 4200, 4300');
}
