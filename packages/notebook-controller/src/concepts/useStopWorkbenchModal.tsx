import * as React from 'react';
import { useUser } from '@odh-dashboard/dashboard-foundation-frontend/redux/selectors';
import { Notebook } from '@odh-dashboard/dashboard-foundation-frontend/types';
import useNotification from '@odh-dashboard/dashboard-foundation-frontend/utilities/useNotification';
import useStopNotebookModalAvailability from '@odh-dashboard/workbenches-shared/concepts/notebooks/useStopNotebookModalAvailability';
import { stopWorkbenches } from '../pages/utils';

type StopWorkbenchModalProps = {
  notebooksToStop: Notebook[];
  refresh: () => void;
};

export const useStopWorkbenchModal = ({
  notebooksToStop,
  refresh,
}: StopWorkbenchModalProps): {
  showModal: boolean;
  isDeleting: boolean;
  onStop: () => void;
  onNotebooksStop: (didStop: boolean) => void;
} => {
  const [showModal, setShowModal] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [dontShowModalValue] = useStopNotebookModalAvailability();
  const notification = useNotification();
  const { isAdmin } = useUser();

  const onNotebooksStop = (didStop: boolean) => {
    if (didStop) {
      setIsDeleting(true);
      stopWorkbenches(notebooksToStop, isAdmin)
        .then(() => {
          refresh();
          setShowModal(false);
        })
        .catch((e) => {
          notification.error(
            `Error stopping workbench${notebooksToStop.length > 1 ? 's' : ''}`,
            e.message,
          );
        })
        .finally(() => {
          setIsDeleting(false);
        });
    } else {
      setShowModal(false);
    }
  };

  const onStop = () => {
    if (dontShowModalValue) {
      onNotebooksStop(true);
    } else {
      setShowModal(true);
    }
  };

  return { showModal, isDeleting, onStop, onNotebooksStop };
};
