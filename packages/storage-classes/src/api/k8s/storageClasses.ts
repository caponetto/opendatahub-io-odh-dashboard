import { k8sGetResource, k8sPatchResource, Patch } from '@odh-dashboard/k8s-browser';
import {
  K8sAPIOptions,
  MetadataAnnotation,
  StorageClassConfig,
  StorageClassKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { StorageClassModel } from '@odh-dashboard/dashboard-foundation-frontend/api/models/k8s';
import { applyK8sAPIOptions } from '@odh-dashboard/dashboard-foundation-frontend/api/apiMergeUtils';
import { getDefaultStorageClassConfig } from '@odh-dashboard/storage-classes-shared/concepts/storageClasses/utils';

export const getStorageClass = (name: string): Promise<StorageClassKind> =>
  k8sGetResource<StorageClassKind>({
    model: StorageClassModel,
    queryOptions: { name },
  });

const getStorageClassUpdateValue = (config: Partial<StorageClassConfig>, oldConfig?: string) => {
  try {
    return JSON.stringify({
      ...(oldConfig && JSON.parse(oldConfig)),
      ...config,
      lastModified: new Date().toISOString(),
    });
  } catch (e) {
    return JSON.stringify({
      ...config,
      lastModified: new Date().toISOString(),
    });
  }
};

export const updateStorageClassConfig = async (
  name: string,
  config: Partial<StorageClassConfig> | undefined,
  opts?: K8sAPIOptions,
): Promise<StorageClassConfig> => {
  const oldStorageClassResource = await getStorageClass(name);
  const oldConfig =
    oldStorageClassResource.metadata.annotations?.[MetadataAnnotation.OdhStorageClassConfig];
  const patches: Patch[] = [];
  if (!oldStorageClassResource.metadata.annotations) {
    patches.push({
      op: 'add',
      path: '/metadata/annotations',
      value: {},
    });
  }
  patches.push({
    op: oldConfig ? 'replace' : 'add',
    path: '/metadata/annotations/opendatahub.io~1sc-config',
    value: config
      ? getStorageClassUpdateValue(
          config,
          oldConfig || JSON.stringify(getDefaultStorageClassConfig(oldStorageClassResource)),
        )
      : '',
  });

  return k8sPatchResource(
    applyK8sAPIOptions(
      {
        model: StorageClassModel,
        queryOptions: {
          name,
        },
        patches,
      },
      opts,
    ),
  ).then((storageClass) =>
    JSON.parse(
      storageClass.metadata?.annotations?.[MetadataAnnotation.OdhStorageClassConfig] ?? '',
    ),
  );
};
