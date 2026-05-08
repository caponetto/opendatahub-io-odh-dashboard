import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { Notebook } from '@odh-dashboard/dashboard-foundation-frontend/types';
import { useGetNotebookRoute } from '@odh-dashboard/workbenches-shared/concepts/notebooks/useGetNotebookRoute';
import { AdminViewUserData } from './types';
import StopServerModal from '../server/StopServerModal';
import { useStopWorkbenchModal } from '../../../concepts/useStopWorkbenchModal';

type StopAllServersButtonProps = {
  users: AdminViewUserData[];
};

const StopAllServersButton: React.FC<StopAllServersButtonProps> = ({ users }) => {
  const activeServers = users
    .filter((user) => user.serverStatus.isNotebookRunning)
    .map((user) => user.serverStatus);

  const serverCount = activeServers.length;

  const notebooksToStop = activeServers
    .map((server) => server.notebook)
    .filter((notebook): notebook is Notebook => !!notebook);

  const hasOnlyOneNotebook = notebooksToStop.length === 1;

  // if there is only one notebook to stop, generate its route link
  const routeLink = useGetNotebookRoute(
    hasOnlyOneNotebook ? notebooksToStop[0].metadata.namespace : undefined,
    hasOnlyOneNotebook ? notebooksToStop[0].metadata.name : undefined,
    hasOnlyOneNotebook
      ? notebooksToStop[0].metadata.annotations?.['notebooks.opendatahub.io/inject-auth'] === 'true'
      : undefined,
    true,
  );

  const { showModal, isDeleting, onStop, onNotebooksStop } = useStopWorkbenchModal({
    notebooksToStop,
    refresh: () => {
      activeServers.forEach((server) => {
        server.forceRefresh();
      });
    },
  });

  return (
    <>
      <Button
        data-testid="stop-all-servers-button"
        variant="secondary"
        isDanger
        isDisabled={serverCount === 0}
        onClick={() => {
          onStop();
        }}
      >
        Stop all workbenches ({serverCount})
      </Button>
      {showModal && (
        <StopServerModal
          notebooksToStop={notebooksToStop}
          link={routeLink}
          isDeleting={isDeleting}
          onNotebooksStop={onNotebooksStop}
        />
      )}
    </>
  );
};

export default StopAllServersButton;
