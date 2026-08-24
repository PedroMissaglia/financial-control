const RD = globalThis.__FINCONTROL_REACT_DOM__;
if (!RD) throw new Error('[mf-shared] ReactDOM bridge missing. Ensure <MfReactBridge /> is mounted.');

export const {
  createPortal,
  flushSync,
  preload,
  preinit,
  preinitModule,
  prefetchDNS,
  preconnect,
  version,
} = RD;

export default RD;
