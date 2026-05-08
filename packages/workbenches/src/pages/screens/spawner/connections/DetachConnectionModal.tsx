import React from 'react';
import { Connection } from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/types';
import { getDisplayNameFromK8sResource } from '@odh-dashboard/dashboard-foundation-frontend/concepts/k8s/utils';
import ContentModal, {
  ButtonAction,
} from '@odh-dashboard/dashboard-foundation-frontend/components/modals/ContentModal';

type Props = {
  connection: Connection;
  isRunning?: boolean;
  notebookDisplayName: string;
  onDetach: () => void;
  onClose: () => void;
};

export const DetachConnectionModal: React.FC<Props> = ({
  connection,
  isRunning,
  notebookDisplayName,
  onDetach,
  onClose,
}) => {
  const connectionName = getDisplayNameFromK8sResource(connection);
  const contents = isRunning ? (
    <div>
      The <b>{connectionName}</b> connection will be detached from the workbench. To avoid losing
      your work, save any recent data in the current workbench, <b>{notebookDisplayName}</b>.
    </div>
  ) : (
    <div>
      The <b>{connectionName}</b> connection will be detached from the <b>{notebookDisplayName}</b>{' '}
      workbench.
    </div>
  );

  const buttonActions: ButtonAction[] = [
    {
      label: 'Detach',
      onClick: onDetach,
      variant: isRunning ? 'danger' : 'primary',
      dataTestId: 'detach-connection-modal-button',
    },
    {
      label: 'Cancel',
      onClick: onClose,
      variant: 'link',
      dataTestId: 'cancel-connection-modal-button',
    },
  ];

  return (
    <ContentModal
      onClose={onClose}
      title="Detach connection?"
      contents={contents}
      buttonActions={buttonActions}
      dataTestId="detach-connection-modal"
      variant="medium"
      titleIconVariant={isRunning ? 'warning' : undefined}
    />
  );
};
