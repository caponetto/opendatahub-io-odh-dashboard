import type { RoleRef } from '@odh-dashboard/dashboard-foundation-frontend/concepts/permissions/types';
import { RoleLabelType } from '@odh-dashboard/dashboard-foundation-frontend/concepts/permissions/types';
import {
  getRoleLabelTypeForRole,
  getRoleLabelTypeForRoleRef,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/permissions/utils';
import type {
  ClusterRoleKind,
  RoleKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';

export type RoleTrackingType =
  | 'ai_default_role'
  | 'ai_custom_role'
  | 'openshift_default_role'
  | 'openshift_custom_role';

/**
 * Maps a role to its tracking category.
 *
 * - Admin and Contributor (ClusterRole admin/edit) → ai_default_role
 * - Dashboard-annotated roles → ai_custom_role
 * - Other bootstrapped OpenShift roles → openshift_default_role
 * - Everything else → openshift_custom_role
 */
export const getRoleTypeForTracking = (
  roleRef: RoleRef,
  role?: RoleKind | ClusterRoleKind,
): RoleTrackingType => {
  const labelType = role ? getRoleLabelTypeForRole(role) : getRoleLabelTypeForRoleRef(roleRef);

  switch (labelType) {
    case RoleLabelType.Dashboard:
      return 'ai_custom_role';
    case RoleLabelType.OpenshiftDefault: {
      const name = (role?.metadata.name ?? roleRef.name).toLowerCase();
      if (name === 'admin' || name === 'edit') {
        return 'ai_default_role';
      }
      return 'openshift_default_role';
    }
    case RoleLabelType.OpenshiftCustom:
      return 'openshift_custom_role';
  }
};
