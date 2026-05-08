import type { Extension, ComponentCodeRef } from '../core/types';

export type ProjectSettingsCardProps = {
  project: { metadata: { name: string; namespace?: string } };
};

export type ProjectSettingsCard = Extension<
  'app.project-details/settings-card',
  {
    id: string;
    component: ComponentCodeRef<ProjectSettingsCardProps>;
  }
>;

export const isProjectSettingsCard = (extension: Extension): extension is ProjectSettingsCard =>
  extension.type === 'app.project-details/settings-card';
