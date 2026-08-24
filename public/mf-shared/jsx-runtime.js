const J = globalThis.__FINCONTROL_JSX_RUNTIME__;
if (!J) throw new Error('[mf-shared] JSX runtime bridge missing. Ensure <MfReactBridge /> is mounted.');

export const { Fragment, jsx, jsxs } = J;
