import * as React from 'react';
import { useUser } from '@odh-dashboard/dashboard-foundation-frontend/redux/selectors';
import { NotebookRunningState } from '@odh-dashboard/dashboard-foundation-frontend/types';
import useNamespaces from '@odh-dashboard/dashboard-foundation-frontend/utilities/useNamespaces';
import { AdminViewUserData, ServerStatus } from './types';
import useCheckForAllowedUsers from './useCheckForAllowedUsers';
import { NotebookControllerContext } from '../../NotebookControllerContext';
import useWatchNotebooksForUsers from '../../../utilities/useWatchNotebooksForUsers';

const useAdminUsers = (): [AdminViewUserData[], boolean, Error | undefined] => {
  const { requestNotebookRefresh } = React.useContext(NotebookControllerContext);
  const { username: loggedInUser } = useUser();

  const { workbenchNamespace } = useNamespaces();
  const [allowedUsers, allowedUsersLoaded, allowedUsersError] = useCheckForAllowedUsers();

  const {
    notebooks,
    loaded: notebookLoaded,
    loadError: notebookError,
    forceRefresh,
  } = useWatchNotebooksForUsers(
    workbenchNamespace,
    allowedUsers.map(({ username }) => username),
  );

  const users: AdminViewUserData[] = allowedUsers.map<AdminViewUserData>((allowedUser) => {
    const notebookRunningState: NotebookRunningState | null =
      notebooks[allowedUser.username] || null;
    const notebook = notebookRunningState?.notebook ?? null;
    const isNotebookRunning = notebookRunningState?.isRunning ?? false;

    const serverStatusObject: ServerStatus = {
      notebook,
      isNotebookRunning,
      forceRefresh: () => {
        forceRefresh([allowedUser.username]);
        if (allowedUser.username === loggedInUser) {
          // Refresh your own state too -- so you can live updates if you navigate or restart your server
          requestNotebookRefresh();
        }
      },
    };

    return {
      name: allowedUser.username,
      privilege: allowedUser.privilege,
      lastActivity: allowedUser.lastActivity,
      serverStatus: serverStatusObject,
      actions: serverStatusObject,
    };
  });

  const isLoaded = notebookLoaded && allowedUsersLoaded;
  const loadError = notebookError || allowedUsersError;
  return [users, isLoaded, loadError];
};

export default useAdminUsers;
