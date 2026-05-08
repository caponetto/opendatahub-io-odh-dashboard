import type { CodeRef, Extension } from '@odh-dashboard/plugin-core';

export type ModelDetailsDeploymentCardExtension = Extension<
  'model-registry.model-details/details-card',
  {
    component: CodeRef<React.ComponentType<{ rmId?: string; mrName?: string }>>;
  }
>;

export const isModelDetailsDeploymentCardExtension = (
  extension: Extension,
): extension is ModelDetailsDeploymentCardExtension =>
  extension.type === 'model-registry.model-details/details-card';
