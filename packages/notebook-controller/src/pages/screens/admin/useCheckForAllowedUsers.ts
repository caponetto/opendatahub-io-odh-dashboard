import * as React from 'react';
import { getAllowedUsers } from '@odh-dashboard/dashboard-foundation-frontend/redux/actions/actions';
import useNamespaces from '@odh-dashboard/dashboard-foundation-frontend/utilities/useNamespaces';
import type { AllowedUser } from '@odh-dashboard/dashboard-foundation-frontend/types/allowedUser';

const useCheckForAllowedUsers = (): [
  allowedUsers: AllowedUser[],
  loaded: boolean,
  error: Error | undefined,
] => {
  const { workbenchNamespace } = useNamespaces();
  const [allowedUsers, setAllowedUsers] = React.useState<AllowedUser[]>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState<Error | undefined>();

  React.useEffect(() => {
    getAllowedUsers(workbenchNamespace)
      .then((users) => {
        setAllowedUsers(users);
        setLoaded(true);
      })
      .catch((e) => {
        setError(new Error(e.response?.data?.message || e.message));
        setLoaded(false);
      });
  }, [workbenchNamespace]);

  return [allowedUsers, loaded, error];
};

export default useCheckForAllowedUsers;
