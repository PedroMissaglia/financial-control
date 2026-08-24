import { createRoot, type Root } from 'react-dom/client';
import type { ReactNode } from 'react';

const roots = new WeakMap<HTMLElement, Root>();

/**
 * Render into a host element. Unmount is deferred so the host tree (same React
 * singleton) can finish its current commit — sync unmount during host render races.
 */
export function renderToMfRoot(element: HTMLElement, node: ReactNode): () => void {
  let root = roots.get(element);
  if (!root) {
    root = createRoot(element);
    roots.set(element, root);
  }
  root.render(node);

  const mountedRoot = root;
  return () => {
    queueMicrotask(() => {
      const current = roots.get(element);
      if (current !== mountedRoot) return;
      current.unmount();
      roots.delete(element);
    });
  };
}
