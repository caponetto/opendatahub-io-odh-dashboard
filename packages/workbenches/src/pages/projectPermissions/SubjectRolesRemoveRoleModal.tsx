import * as React from 'react';
import { Stack, StackItem } from '@patternfly/react-core';
import { getRoleDisplayName } from '@odh-dashboard/dashboard-foundation-frontend/concepts/permissions/utils';
import DeleteModal from '@odh-dashboard/dashboard-foundation-frontend/components/DeleteModal';
import { ODH_PRODUCT_NAME } from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import { isAiRole } from '@odh-dashboard/workbenches/pages/projectPermissions/utils';
import type { SubjectRoleRow } from './types';

type SubjectRolesRemoveRoleModalProps = {
  row: SubjectRoleRow;
  isSubmitting: boolean;
  error?: Error;
  onClose: () => void;
  onConfirm: () => void;
};

const SubjectRolesRemoveRoleModal: React.FC<SubjectRolesRemoveRoleModalProps> = ({
  row,
  isSubmitting,
  error,
  onClose,
  onConfirm,
}) => {
  const roleDisplayName = getRoleDisplayName(row.roleRef, row.role);
  const isReversible = isAiRole(row.roleRef, row.role);
  return (
    <DeleteModal
      title="Unassign role?"
      onClose={onClose}
      deleting={isSubmitting}
      onDelete={onConfirm}
      deleteName={row.subjectName}
      submitButtonLabel="Unassign role"
      error={error}
      typeConfirmationLabel="unassignment"
      removeConfirmation={isReversible}
    >
      <Stack hasGutter>
        {!isReversible ? (
          <StackItem>
            The <strong>{roleDisplayName}</strong> role was assigned to{' '}
            <strong>{row.subjectName}</strong> from OpenShift. It cannot be reassigned from{' '}
            {ODH_PRODUCT_NAME}.
          </StackItem>
        ) : null}
        <StackItem>
          <strong>{row.subjectName}</strong> will lose all permissions associated with the{' '}
          <strong>{roleDisplayName}</strong> role.
        </StackItem>
      </Stack>
    </DeleteModal>
  );
};

export default SubjectRolesRemoveRoleModal;
