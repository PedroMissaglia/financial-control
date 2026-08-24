'use client';

import { useEffect } from 'react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';
import * as JsxRuntime from 'react/jsx-runtime';
import * as JsxDevRuntime from 'react/jsx-dev-runtime';

import { prefetchDashboardExpose } from '@/lib/load-mf-remote';
import { useAppSelector } from '@/store/hooks';

declare global {
  interface Window {
    __FINCONTROL_REACT__?: typeof React;
    __FINCONTROL_REACT_DOM__?: typeof ReactDOM;
    __FINCONTROL_REACT_DOM_CLIENT__?: typeof ReactDOMClient;
    __FINCONTROL_JSX_RUNTIME__?: typeof JsxRuntime;
    __FINCONTROL_JSX_DEV_RUNTIME__?: typeof JsxDevRuntime;
    __FINCONTROL_REACT_BRIDGE_READY__?: boolean;
  }
}

/** Expose the host React singleton for mf-dashboard ESM imports via /mf-shared/*.js */
if (typeof window !== 'undefined') {
  window.__FINCONTROL_REACT__ = React;
  window.__FINCONTROL_REACT_DOM__ = ReactDOM;
  window.__FINCONTROL_REACT_DOM_CLIENT__ = ReactDOMClient;
  window.__FINCONTROL_JSX_RUNTIME__ = JsxRuntime;
  window.__FINCONTROL_JSX_DEV_RUNTIME__ = JsxDevRuntime;
  window.__FINCONTROL_REACT_BRIDGE_READY__ = true;
}

/**
 * Host React bridge + warm mf-dashboard remote after auth (bridge is already ready).
 */
export function MfReactBridge() {
  const usuarioId = useAppSelector(state => state.auth.usuario?.id);

  useEffect(() => {
    if (!usuarioId) return;
    prefetchDashboardExpose('./DashboardView');
  }, [usuarioId]);

  return null;
}
