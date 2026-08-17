import { DashboardEditorApp } from '@/apps/dashboard-editor-app';
import { renderToMfRoot } from '@/lib/mf-root';
import type { DashboardEditorProps } from '../../../shared/dashboard-contract';
import '@/styles.css';

export async function mount(element: HTMLElement, props: DashboardEditorProps): Promise<() => void> {
  return renderToMfRoot(element, <DashboardEditorApp {...props} />);
}
