import { DashboardViewApp } from '@/apps/dashboard-view-app';
import { renderToMfRoot } from '@/lib/mf-root';
import type { DashboardViewProps } from '../../../shared/dashboard-contract';
import '@/styles.css';

export async function mount(element: HTMLElement, props: DashboardViewProps): Promise<() => void> {
  return renderToMfRoot(element, <DashboardViewApp {...props} />);
}
