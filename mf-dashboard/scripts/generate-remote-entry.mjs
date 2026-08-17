import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { DASHBOARD_EXPOSES, REMOTE_ENTRY_NAME } from './exposes-config.mjs';

const distDir = join(process.cwd(), 'dist');
const remoteEntry = {
  name: REMOTE_ENTRY_NAME,
  builtAt: String(Date.now()),
  shared: [],
  exposes: DASHBOARD_EXPOSES.map(expose => ({
    key: `./${expose.name}`,
    outFileName: `${expose.name}.js`,
  })),
};

writeFileSync(join(distDir, 'remoteEntry.json'), `${JSON.stringify(remoteEntry, null, 2)}\n`, 'utf8');
