import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { DASHBOARD_EXPOSES, REMOTE_ENTRY_NAME } from './exposes-config.mjs';

const distDir = join(process.cwd(), 'dist');

/** Declared so the host import-maps React to /mf-shared (host singleton). */
const SHARED = [
  { packageName: 'react', outFileName: 'shared/react.js' },
  { packageName: 'react-dom', outFileName: 'shared/react-dom.js' },
  { packageName: 'react-dom/client', outFileName: 'shared/react-dom-client.js' },
  { packageName: 'react/jsx-runtime', outFileName: 'shared/jsx-runtime.js' },
  { packageName: 'react/jsx-dev-runtime', outFileName: 'shared/jsx-dev-runtime.js' },
];

const remoteEntry = {
  name: REMOTE_ENTRY_NAME,
  builtAt: String(Date.now()),
  shared: SHARED,
  exposes: DASHBOARD_EXPOSES.map(expose => ({
    key: `./${expose.name}`,
    outFileName: `${expose.name}.js`,
  })),
};

writeFileSync(join(distDir, 'remoteEntry.json'), `${JSON.stringify(remoteEntry, null, 2)}\n`, 'utf8');
