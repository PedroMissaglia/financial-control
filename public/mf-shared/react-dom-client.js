const C = globalThis.__FINCONTROL_REACT_DOM_CLIENT__;
if (!C) throw new Error('[mf-shared] ReactDOMClient bridge missing. Ensure <MfReactBridge /> is mounted.');

export const { createRoot, hydrateRoot } = C;
