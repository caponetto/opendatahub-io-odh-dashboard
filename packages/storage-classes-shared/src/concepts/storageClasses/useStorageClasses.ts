import useFetchState, {
  FetchState,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import { StorageClassKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { getStorageClasses } from '#~/api/k8s/storageClasses';

const useStorageClasses = (): FetchState<StorageClassKind[]> =>
  useFetchState(getStorageClasses, []);

export default useStorageClasses;
