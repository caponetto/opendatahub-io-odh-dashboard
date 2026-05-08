import { K8sResourceCommon } from '@odh-dashboard/k8s-browser';
import {
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  PageSection,
  Spinner,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import React from 'react';
import {
  RoleBindingPermissionsRBType,
  RoleBindingPermissionsRoleType,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/roleBinding/types';
import {
  filterRoleBindingSubjects,
  removePrefix,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/roleBinding/utils';
import {
  RoleBindingKind,
  RoleBindingRoleRef,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { ProjectsContext } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/ProjectsContext';
import { ProjectSectionID } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/projectSectionId';
import RoleBindingPermissionsTableSection from '@odh-dashboard/dashboard-foundation-frontend/concepts/roleBinding/RoleBindingPermissionsTableSection';
import { FetchStateObject } from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetch';
import {
  createModelRegistryRoleBinding,
  deleteModelRegistryRoleBinding,
} from '../../../services/modelRegistrySettingsService';

type RoleBindingProjectPermissionsProps = {
  ownerReference?: K8sResourceCommon;
  roleBindingPermissionsRB: FetchStateObject<RoleBindingKind[]>;
  permissionOptions: {
    type: RoleBindingPermissionsRoleType;
    description: string;
  }[];
  projectName: string;
  roleRefName?: RoleBindingRoleRef['name'];
  labels?: { [key: string]: string };
  isProjectSubject?: boolean;
  description: string;
};

const ProjectsSettingsTab: React.FC<RoleBindingProjectPermissionsProps> = ({
  ownerReference,
  roleBindingPermissionsRB,
  permissionOptions,
  projectName,
  roleRefName,
  labels,
  isProjectSubject,
  description,
}) => {
  const {
    data: roleBindings,
    loaded,
    error: loadError,
    refresh: refreshRB,
  } = roleBindingPermissionsRB;

  const { projects } = React.useContext(ProjectsContext);
  const filteredProjects = React.useMemo(
    () => projects.filter((project) => !removePrefix(roleBindings).includes(project.metadata.name)),
    [projects, roleBindings],
  );

  if (loadError) {
    return (
      <EmptyState
        headingLevel="h2"
        icon={ExclamationCircleIcon}
        titleText="There was an issue loading projects"
        variant={EmptyStateVariant.lg}
        data-id="error-empty-state"
        id={ProjectSectionID.PERMISSIONS}
      >
        <EmptyStateBody>{loadError.message}</EmptyStateBody>
      </EmptyState>
    );
  }

  if (!loaded) {
    return (
      <EmptyState
        headingLevel="h2"
        titleText="Loading"
        variant={EmptyStateVariant.lg}
        data-id="loading-empty-state"
        id={ProjectSectionID.PERMISSIONS}
      >
        <Spinner size="xl" />
      </EmptyState>
    );
  }

  return (
    <PageSection hasBodyWrapper={false} isFilled>
      <Stack hasGutter>
        <StackItem>{description}</StackItem>
        <StackItem>
          <RoleBindingPermissionsTableSection
            ownerReference={ownerReference}
            roleBindings={filterRoleBindingSubjects(
              roleBindings,
              RoleBindingPermissionsRBType.GROUP,
              isProjectSubject,
            )}
            projectName={projectName}
            roleRefKind="Role"
            roleRefName={roleRefName}
            labels={labels}
            subjectKind={RoleBindingPermissionsRBType.GROUP}
            permissionOptions={permissionOptions}
            typeAhead={
              filteredProjects.length > 0
                ? filteredProjects.map((project) => project.metadata.name)
                : undefined
            }
            refresh={refreshRB}
            typeModifier="project"
            isProjectSubject={isProjectSubject}
            createRoleBinding={createModelRegistryRoleBinding}
            deleteRoleBinding={deleteModelRegistryRoleBinding}
          />
        </StackItem>
      </Stack>
    </PageSection>
  );
};

export default ProjectsSettingsTab;
