import * as React from 'react';
import { listRoleBindings } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/roleBindings';
import { RoleBindingKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import useFetch, {
  FetchOptions,
  FetchStateObject,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetch';

const useProjectSharing = (
  namespace?: string,
  fetchOptions?: Partial<FetchOptions>,
): FetchStateObject<RoleBindingKind[]> => {
  const getProjectSharingRoleBindings = React.useCallback(
    () =>
      listRoleBindings(namespace).catch((e) => {
        if (e.statusObject?.code === 404) {
          throw new Error('No rolebindings found.');
        }
        throw e;
      }),
    [namespace],
  );

  return useFetch<RoleBindingKind[]>(getProjectSharingRoleBindings, [], fetchOptions);
};

export default useProjectSharing;
