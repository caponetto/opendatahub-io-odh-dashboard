import {
  ImageStreamSpecTagType,
  NotebookKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { getImageVersionDependencies } from '@odh-dashboard/dashboard-foundation-frontend/utilities/imageStreamUtils';

const ELYRA_SECRET_NAME = 'ds-pipeline-config';

export const currentlyHasPipelines = (notebook: NotebookKind): boolean =>
  !!notebook.spec.template.spec.volumes?.find((v) => v.secret?.secretName === ELYRA_SECRET_NAME);

export const isElyraVersionUpToDate = (imageVersion: ImageStreamSpecTagType): boolean => {
  const deps = getImageVersionDependencies(imageVersion);
  return deps.some((dep) => dep.name.toLowerCase() === 'odh-elyra');
};

export const isElyraVersionOutOfDate = (imageVersion: ImageStreamSpecTagType): boolean => {
  const deps = getImageVersionDependencies(imageVersion);
  return deps.some((dep) => dep.name.toLowerCase() === 'elyra');
};
