import React from 'react';
import { Stack, StackItem } from '@patternfly/react-core';
import { deleteHardwareProfile } from '@odh-dashboard/hardware-profiles-shared/api/k8s/hardwareProfiles';
import { HardwareProfileKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import DeleteModal from '@odh-dashboard/dashboard-foundation-frontend/components/DeleteModal';
import { getHardwareProfileDisplayName } from '@odh-dashboard/hardware-profiles-shared/concepts/hardwareProfiles/pages/utils';

type DeleteHardwareProfileModalProps = {
  hardwareProfile: HardwareProfileKind;
  onClose: (deleted: boolean) => void;
};

const DeleteHardwareProfileModal: React.FC<DeleteHardwareProfileModalProps> = ({
  hardwareProfile,
  onClose,
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<Error | undefined>();

  const onBeforeClose = (deleted: boolean) => {
    onClose(deleted);
    setIsDeleting(false);
    setError(undefined);
  };

  const displayName = getHardwareProfileDisplayName(hardwareProfile);

  return (
    <DeleteModal
      title="Delete hardware profile?"
      onClose={() => onBeforeClose(false)}
      submitButtonLabel="Delete"
      deleteName={displayName}
      onDelete={() => {
        setIsDeleting(true);

        const deletePromise = () => {
          return deleteHardwareProfile(
            hardwareProfile.metadata.name,
            hardwareProfile.metadata.namespace,
          );
        };

        deletePromise()
          .then(() => {
            onBeforeClose(true);
          })
          .catch((e) => {
            setError(e);
            setIsDeleting(false);
          });
      }}
      deleting={isDeleting}
      error={error}
    >
      <Stack hasGutter>
        <StackItem>Deployed workloads using this profile will not be affected.</StackItem>
      </Stack>
    </DeleteModal>
  );
};

export default DeleteHardwareProfileModal;
