import { copyFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(import.meta.dirname, '../dist/mf-transacoes/browser');
if (!existsSync(dir)) {
  console.warn('[mf-transacoes] dist/browser ausente — rode ng build antes');
  process.exit(0);
}

const hashed = readdirSync(dir).find(name => /^styles.*\.css$/.test(name) && name !== 'styles.css');

if (hashed) {
  copyFileSync(join(dir, hashed), join(dir, 'styles.css'));
  console.log(`[mf-transacoes] aliased ${hashed} -> styles.css`);
}
