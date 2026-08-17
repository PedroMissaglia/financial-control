import { ApplicationRef } from '@angular/core';
import { createApplication } from '@angular/platform-browser';

import { ensureHostIsolationStyles, ensureMaterialFonts, MF_PROVIDERS } from './mf-providers';

let appRef: ApplicationRef | null = null;
let appReady: Promise<ApplicationRef> | null = null;

export async function getMfApp(): Promise<ApplicationRef> {
  if (appRef) return appRef;

  appReady ??= (async () => {
    ensureMaterialFonts();
    ensureHostIsolationStyles();
    const app = await createApplication({ providers: MF_PROVIDERS });
    appRef = app;
    return app;
  })();

  return appReady;
}
