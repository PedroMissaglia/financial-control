import { createRoot, type Root } from 'react-dom/client';
import type { ReactNode } from 'react';

const roots = new WeakMap<HTMLElement, Root>();

export function renderToMfRoot(element: HTMLElement, node: ReactNode): () => void {
  let root = roots.get(element);
  if (!root) {
    root = createRoot(element);
    roots.set(element, root);
  }
  root.render(node);
  return () => {
    const current = roots.get(element);
    current?.unmount();
    roots.delete(element);
  };
}
