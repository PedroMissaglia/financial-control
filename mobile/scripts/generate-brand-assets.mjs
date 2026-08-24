/**
 * Gera icon.png (1024) e splash.png (2732) da marca Fin Control.
 * Uso: node scripts/generate-brand-assets.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '../resources');

const PRIMARY = '#0891b2';
const SPLASH_BG = '#f0fbfc';

/** Carteira (paths do src/app/icon.svg) em viewBox 0 0 24 24 */
const walletSvg = (size, stroke = '#ffffff', strokeWidth = 1.8) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none">
  <g stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">
    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/>
    <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>
  </g>
</svg>`;

async function svgToPng(svg, size) {
  return sharp(Buffer.from(svg.trim())).resize(size, size).png().toBuffer();
}

async function buildIcon() {
  const canvas = 1024;
  const iconSize = Math.round(canvas * 0.55);
  const wallet = await svgToPng(walletSvg(iconSize, '#ffffff', 1.6), iconSize);

  return sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 3,
      background: PRIMARY,
    },
  })
    .composite([{ input: wallet, gravity: 'centre' }])
    .png()
    .toBuffer();
}

async function buildSplash() {
  const canvas = 2732;
  const iconSize = Math.round(canvas * 0.22);
  // Marca em primary sobre fundo claro (quadrado arredondado + carteira)
  const badge = Math.round(iconSize * 1.15);
  const rx = Math.round(badge * 0.22);
  const badgeSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${badge}" height="${badge}" viewBox="0 0 ${badge} ${badge}">
  <rect width="${badge}" height="${badge}" rx="${rx}" fill="${PRIMARY}"/>
</svg>`;
  const badgePng = await sharp(Buffer.from(badgeSvg.trim())).png().toBuffer();
  const wallet = await svgToPng(walletSvg(iconSize, '#ffffff', 1.5), iconSize);

  const mark = await sharp(badgePng)
    .composite([{ input: wallet, gravity: 'centre' }])
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 3,
      background: SPLASH_BG,
    },
  })
    .composite([{ input: mark, gravity: 'centre' }])
    .png()
    .toBuffer();
}

mkdirSync(outDir, { recursive: true });
const icon = await buildIcon();
const splash = await buildSplash();
writeFileSync(resolve(outDir, 'icon.png'), icon);
writeFileSync(resolve(outDir, 'splash.png'), splash);
console.log('Wrote', resolve(outDir, 'icon.png'));
console.log('Wrote', resolve(outDir, 'splash.png'));
