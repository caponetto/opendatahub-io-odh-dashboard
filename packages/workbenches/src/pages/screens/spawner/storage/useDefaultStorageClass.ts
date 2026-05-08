import * as React from 'react';
import { AppContext } from '@odh-dashboard/dashboard-foundation-frontend/app/AppContext';
import {
  useIsAreaAvailable,
  SupportedArea,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import useStorageClasses from '@odh-dashboard/storage-classes-shared/concepts/storageClasses/useStorageClasses';
import {
  MetadataAnnotation,
  StorageClassKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { getStorageClassConfig } from '@odh-dashboard/storage-classes-shared/concepts/storageClasses/utils';
import useFetchState, {
  FetchState,
  FetchStateCallbackPromise,
  NotReadyError,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';

const useAdminDefaultStorageClassInternal = (): FetchState<StorageClassKind | null> => {
  const isStorageClassesAvailable = useIsAreaAvailable(SupportedArea.STORAGE_CLASSES).status;
  const [storageClasses, storageClassesLoaded, storageClassesError] = useStorageClasses();

  const fetchDefaultStorageClass: FetchStateCallbackPromise<StorageClassKind | null> =
    React.useCallback(
      () =>
        new Promise((resolve, reject) => {
          if (!isStorageClassesAvailable) {
            resolve(null);
          }
          if (!storageClassesLoaded) {
            reject(new NotReadyError('Storage classes are not loaded'));
          }
          if (storageClassesError) {
            resolve(null);
          }

          const enabledStorageClasses = storageClasses.filter(
            (sc) => getStorageClassConfig(sc)?.isEnabled === true,
          );

          const defaultSc = enabledStorageClasses.find(
            (sc) => getStorageClassConfig(sc)?.isDefault === true,
          );

          if (!defaultSc && enabledStorageClasses.length > 0) {
            resolve(enabledStorageClasses[0]);
          } else if (defaultSc) {
            resolve(defaultSc);
          } else {
            resolve(null);
          }
        }),
      [storageClasses, storageClassesLoaded, storageClassesError, isStorageClassesAvailable],
    );

  return useFetchState(fetchDefaultStorageClass, null);
};

const usePreferredStorageClassInternal = (): StorageClassKind | undefined => {
  const {
    dashboardConfig: {
      spec: { notebookController },
    },
    storageClasses,
  } = React.useContext(AppContext);

  const defaultClusterStorageClasses = storageClasses.filter(
    (storageclass) =>
      storageclass.metadata.annotations?.[MetadataAnnotation.StorageClassIsDefault] === 'true',
  );

  const configStorageClassName = notebookController?.storageClassName ?? '';

  if (defaultClusterStorageClasses.length !== 0) {
    return undefined;
  }

  if (configStorageClassName === '') {
    return undefined;
  }

  const storageClassDashBoardConfigVsCluster = storageClasses.filter(
    (storageclass) => storageclass.metadata.name === configStorageClassName,
  );

  if (storageClassDashBoardConfigVsCluster.length === 0) {
    // eslint-disable-next-line no-console
    console.error(
      'no cluster default storageclass set and notebookController.storageClassName entry is not in list of cluster StorageClasses',
    );

    return undefined;
  }

  return storageClassDashBoardConfigVsCluster[0];
};

const useOpenshiftDefaultStorageClassInternal = (): StorageClassKind | undefined => {
  const { storageClasses } = React.useContext(AppContext);

  const defaultClusterStorageClasses = storageClasses.filter(
    (storageclass) =>
      storageclass.metadata.annotations?.[MetadataAnnotation.StorageClassIsDefault] === 'true',
  );

  if (defaultClusterStorageClasses.length > 0) {
    return defaultClusterStorageClasses[0];
  }

  return undefined;
};

export const useDefaultStorageClass = (
  fallbackToFirst = false,
): FetchState<StorageClassKind | null> => {
  const [
    adminDefaultStorageClass,
    adminDefaultStorageClassLoaded,
    adminDefaultStorageClassError,
    refresh,
  ] = useAdminDefaultStorageClassInternal();
  const isStorageClassesAvailable = useIsAreaAvailable(SupportedArea.STORAGE_CLASSES).status;
  const preferredStorageClass = usePreferredStorageClassInternal();
  const openshiftDefaultStorageClass = useOpenshiftDefaultStorageClassInternal();
  const [storageClasses, storageClassesLoaded, storageClassesError] = useStorageClasses();

  let storageClass: StorageClassKind | null = null;
  let error: Error | undefined;
  let loaded = true;

  if (
    isStorageClassesAvailable &&
    adminDefaultStorageClassLoaded &&
    !adminDefaultStorageClassError
  ) {
    storageClass = adminDefaultStorageClass;
    loaded = adminDefaultStorageClassLoaded;
  } else if (preferredStorageClass) {
    storageClass = preferredStorageClass;
  } else if (openshiftDefaultStorageClass) {
    storageClass = openshiftDefaultStorageClass;
  } else if (fallbackToFirst && (storageClassesLoaded || storageClassesError)) {
    storageClass = storageClasses[0] || null;
    error = storageClassesError;
    loaded = storageClassesLoaded;
  }

  if (!storageClass && isStorageClassesAvailable && adminDefaultStorageClassError) {
    error = adminDefaultStorageClassError;
    loaded = adminDefaultStorageClassLoaded;
  }

  return [storageClass, loaded, error, refresh];
};
