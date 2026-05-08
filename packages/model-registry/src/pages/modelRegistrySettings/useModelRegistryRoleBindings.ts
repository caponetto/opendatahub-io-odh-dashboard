import * as React from 'react';
import { RoleBindingKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { POLL_INTERVAL } from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import useFetch, {
  FetchStateObject,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetch';
import { listModelRegistryRoleBindings } from '../../services/modelRegistrySettingsService';

const readK8sStatusCode = (error: unknown): number | undefined => {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const statusObject = Reflect.get(error, 'statusObject');
  if (typeof statusObject !== 'object' || statusObject === null) {
    return undefined;
  }

  const code = Reflect.get(statusObject, 'code');
  return typeof code === 'number' ? code : undefined;
};

const useModelRegistryRoleBindings = (): FetchStateObject<RoleBindingKind[]> => {
  const getRoleBindings = React.useCallback(
    () =>
      listModelRegistryRoleBindings().catch((err: unknown) => {
        if (readK8sStatusCode(err) === 404) {
          throw new Error('No rolebindings found.');
        }
        throw err;
      }),
    [],
  );

  return useFetch<RoleBindingKind[]>(getRoleBindings, [], { refreshRate: POLL_INTERVAL });
};

export default useModelRegistryRoleBindings;
