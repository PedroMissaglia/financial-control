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

/** React 19 batches automatically; @dnd-kit still named-imports this from react-dom. */
export const unstable_batchedUpdates =
  typeof RD.unstable_batchedUpdates === 'function'
    ? RD.unstable_batchedUpdates
    : function unstable_batchedUpdates(callback, a) {
        return callback(a);
      };

export default RD;
