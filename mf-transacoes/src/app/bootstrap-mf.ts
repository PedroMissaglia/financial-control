import { createCustomElement } from '@angular/elements';

import { getMfApp } from './mf-app';
import { FILTROS_VAZIOS, TransacoesFiltros, TransacoesListComponent } from './transacoes-list.component';

export interface TransacoesMfProps {
  apiUrl: string;
  usuarioId?: string;
  usuarioIds?: string[];
  accessToken?: string;
  filtros: TransacoesFiltros;
  pageSize: number;
  categoriaLabels?: Record<string, string>;
  donoLabels?: Record<string, string>;
}

export type { TransacoesFiltros };

const CUSTOM_ELEMENT_TAG = 'mf-transacoes-list';

function ensureCustomElement(app: Awaited<ReturnType<typeof getMfApp>>): void {
  if (customElements.get(CUSTOM_ELEMENT_TAG)) return;

  const elementCtor = createCustomElement(TransacoesListComponent, { injector: app.injector });
  customElements.define(CUSTOM_ELEMENT_TAG, elementCtor);
}

export async function mount(element: HTMLElement, props: TransacoesMfProps): Promise<() => void> {
  const app = await getMfApp();
  ensureCustomElement(app);

  const node = document.createElement(CUSTOM_ELEMENT_TAG) as HTMLElement & TransacoesMfProps;
  node.apiUrl = props.apiUrl;
  node.usuarioId = props.usuarioId ?? '';
  node.usuarioIds = props.usuarioIds ?? (props.usuarioId ? [props.usuarioId] : []);
  node.accessToken = props.accessToken ?? '';
  node.filtros = props.filtros ?? FILTROS_VAZIOS;
  node.pageSize = props.pageSize ?? 8;
  node.categoriaLabels = props.categoriaLabels ?? {};
  node.donoLabels = props.donoLabels ?? {};
  element.replaceChildren(node);

  return () => {
    element.replaceChildren();
  };
}

export default mount;
