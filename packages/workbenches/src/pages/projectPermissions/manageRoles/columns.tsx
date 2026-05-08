import * as React from 'react';
import { Content, ContentVariants } from '@patternfly/react-core';
import type { SortableData } from '@odh-dashboard/dashboard-foundation-frontend/components/table/types';
import type { RoleRef } from '@odh-dashboard/dashboard-foundation-frontend/concepts/permissions/types';
import type {
  ClusterRoleKind,
  RoleKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { ODH_PRODUCT_NAME } from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import { fireSimpleTrackingEvent } from '@odh-dashboard/dashboard-foundation-frontend/concepts/analyticsTracking/segmentIOUtils';
import { AssignmentStatus } from '@odh-dashboard/workbenches/pages/projectPermissions/types';

export type ManageRolesRow = {
  roleRef: RoleRef;
  role?: RoleKind | ClusterRoleKind;
  displayName: string;
  statusLabel?: AssignmentStatus;
};

export const manageRolesColumns: SortableData<ManageRolesRow>[] = [
  { label: '', field: 'checkbox', width: 10, sortable: false },
  {
    label: 'Role name',
    field: 'role',
    width: 20,
    sortable: (a, b) => a.displayName.localeCompare(b.displayName),
  },
  { label: 'Description', field: 'description', width: 35, sortable: false },
  {
    label: 'Role type',
    field: 'roleType',
    width: 20,
    sortable: false,
    info: {
      popover: (
        <Content component={ContentVariants.ul}>
          <Content component={ContentVariants.li}>
            <strong>AI roles</strong> are intended for use in, and can be assigned from,{' '}
            {ODH_PRODUCT_NAME}.
          </Content>
          <Content component={ContentVariants.li}>
            <strong>OpenShift default roles</strong> are OOTB OpenShift roles that can be assigned
            from OpenShift or {ODH_PRODUCT_NAME}.
          </Content>
          <Content component={ContentVariants.li}>
            <strong>OpenShift custom roles</strong> are admin-created roles that can only be
            assigned from OpenShift.
          </Content>
        </Content>
      ),
      ariaLabel: 'Role type help',
      popoverProps: {
        onShown: (): void => {
          fireSimpleTrackingEvent('RBAC Help Reviewed');
        },
      },
    },
  },
  {
    label: 'Assignment status',
    field: 'status',
    width: 20,
    sortable: (a, b) => (a.statusLabel ?? '').localeCompare(b.statusLabel ?? ''),
    info: {
      popover: (
        <Content component={ContentVariants.ul}>
          <Content component={ContentVariants.li}>
            <strong>Assigned:</strong> The role is applied to the user or group.
          </Content>
          <Content component={ContentVariants.li}>
            <strong>Assigning:</strong> The role will be applied when changes are saved.
          </Content>
          <Content component={ContentVariants.li}>
            <strong>Unassigning:</strong> The role will be revoked when changes are saved.
          </Content>
        </Content>
      ),
      ariaLabel: 'Assignment status help',
      popoverProps: {
        onShown: (): void => {
          fireSimpleTrackingEvent('RBAC Help Reviewed');
        },
      },
    },
  },
];

export const ASSIGNMENT_STATUS_COLUMN_INDEX = manageRolesColumns.findIndex(
  ({ field }) => field === 'status',
);
