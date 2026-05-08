import {
  AccessMode,
  StorageClassConfig,
  StorageClassKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import useStorageClasses from './useStorageClasses';
import { getPossibleStorageClassAccessModes } from './utils';

export const useGetStorageClassConfig = (
  storageClassName?: string,
): {
  storageClasses: StorageClassKind[];
  storageClassesLoaded: boolean;
  selectedStorageClassConfig?: StorageClassConfig;
  adminSupportedAccessModes: AccessMode[];
} => {
  const [storageClasses, storageClassesLoaded] = useStorageClasses();
  const selectedStorageClass = storageClasses.find((sc) => sc.metadata.name === storageClassName);

  const { selectedStorageClassConfig, adminSupportedAccessModes } =
    getPossibleStorageClassAccessModes(selectedStorageClass);

  return {
    storageClasses,
    storageClassesLoaded,
    selectedStorageClassConfig,
    adminSupportedAccessModes,
  };
};
