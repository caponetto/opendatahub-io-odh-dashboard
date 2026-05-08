import * as React from 'react';
import { ProjectDetailsContext } from '@odh-dashboard/projects-shared/concepts/projects/ProjectDetailsContext';
import RoleBindingPermissions from '@odh-dashboard/dashboard-foundation-frontend/concepts/roleBinding/RoleBindingPermissions';
import { RoleBindingPermissionsRoleType } from '@odh-dashboard/dashboard-foundation-frontend/concepts/roleBinding/types';
import {
  createRoleBinding,
  deleteRoleBinding,
} from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/roleBindings';

const ProjectSharing: React.FC = () => {
  const {
    currentProject,
    projectSharingRB,
    groups: [groups],
  } = React.useContext(ProjectDetailsContext);
  const safeGroups = React.useMemo(() => groups ?? [], [groups]);

  return (
    <RoleBindingPermissions
      permissionOptions={[
        {
          type: RoleBindingPermissionsRoleType.EDIT,
          description: 'View and edit the project components',
        },
        {
          type: RoleBindingPermissionsRoleType.ADMIN,
          description: 'Edit the project and manage user access',
        },
      ]}
      roleRefKind="ClusterRole"
      projectName={currentProject.metadata.name}
      description="Add users and groups that can access the project."
      roleBindingPermissionsRB={projectSharingRB}
      groups={safeGroups}
      createRoleBinding={createRoleBinding}
      deleteRoleBinding={deleteRoleBinding}
    />
  );
};

export default ProjectSharing;
