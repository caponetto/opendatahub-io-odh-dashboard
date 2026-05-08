import type { Extension, ComponentCodeRef } from '../core/types';

export type OverviewSectionExtension = Extension<
  'app.project-details/overview-section',
  {
    id: string;
    title: string;
    component: ComponentCodeRef;
  }
>;

export const isOverviewSectionExtension = (
  extension: Extension,
): extension is OverviewSectionExtension =>
  extension.type === 'app.project-details/overview-section';
