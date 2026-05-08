import React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  ClipboardCopy,
  Tab,
  TabContent,
  TabContentBody,
  Tabs,
} from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import { Navigate, useParams } from 'react-router';
import {
  KnownLabels,
  ModelRegistryKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { useGroups } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/groups';
import RoleBindingPermissions from '@odh-dashboard/dashboard-foundation-frontend/concepts/roleBinding/RoleBindingPermissions';
import ApplicationsPage from '@odh-dashboard/dashboard-foundation-frontend/components/ApplicationsPage';
import {
  SupportedArea,
  AreaContext,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import { RoleBindingPermissionsRoleType } from '@odh-dashboard/dashboard-foundation-frontend/concepts/roleBinding/types';
import RedirectErrorState from '@odh-dashboard/dashboard-foundation-frontend/pages/external/RedirectErrorState';
import { useModelRegistryNamespaceCR } from '@odh-dashboard/model-registry/concepts/modelRegistry/context/useModelRegistryNamespaceCR';
import useModelRegistryRoleBindings from './useModelRegistryRoleBindings';
import ProjectsSettingsTab from './ProjectsTab/ProjectsSettingsTab';
import {
  createModelRegistryRoleBinding,
  deleteModelRegistryRoleBinding,
} from '../../services/modelRegistrySettingsService';

const ModelRegistriesManagePermissions: React.FC = () => {
  const { dscStatus } = React.useContext(AreaContext);
  const modelRegistryNamespace = dscStatus?.components?.modelregistry?.registriesNamespace;
  const [activeTabKey, setActiveTabKey] = React.useState('users');
  const [ownerReference, setOwnerReference] = React.useState<ModelRegistryKind>();
  const [groups] = useGroups();
  const safeGroups = React.useMemo(() => groups ?? [], [groups]);
  const roleBindings = useModelRegistryRoleBindings();
  const { mrName } = useParams<{ mrName: string }>();
  const state = useModelRegistryNamespaceCR(modelRegistryNamespace, mrName || '');
  const [modelRegistryCR, crLoaded] = state;
  const filteredRoleBindings = roleBindings.data.filter(
    (rb) => rb.metadata.labels?.['app.kubernetes.io/name'] === mrName,
  );

  const error = !modelRegistryNamespace
    ? new Error('No registries namespace could be found')
    : null;

  React.useEffect(() => {
    if (modelRegistryCR) {
      setOwnerReference(modelRegistryCR);
    } else {
      setOwnerReference(undefined);
    }
  }, [modelRegistryCR]);

  if (!modelRegistryNamespace) {
    return (
      <ApplicationsPage loaded empty={false}>
        <RedirectErrorState title="Could not load component state" errorMessage={error?.message} />
      </ApplicationsPage>
    );
  }

  if (
    (roleBindings.loaded && filteredRoleBindings.length === 0) ||
    (crLoaded && !modelRegistryCR)
  ) {
    return <Navigate to="/settings/model-resources-operations/model-registry" replace />;
  }

  return (
    <ApplicationsPage
      title={`Manage ${mrName ?? ''} permissions`}
      description="Manage access to this model registry for individual users and user groups, and for service accounts in a project."
      breadcrumb={
        <Breadcrumb>
          <BreadcrumbItem
            render={() => (
              <Link to="/settings/model-resources-operations/model-registry">
                Model registry settings
              </Link>
            )}
          />
          <BreadcrumbItem isActive>Manage Permissions</BreadcrumbItem>
        </Breadcrumb>
      }
      loaded
      empty={false}
      provideChildrenPadding
    >
      <Tabs
        activeKey={activeTabKey}
        onSelect={(e, tabKey) => {
          setActiveTabKey(tabKey.toString());
        }}
      >
        <Tab eventKey="users" title="Users" id="users-tab" tabContentId="users-tab-content" />
        <Tab
          eventKey="projects"
          title="Projects"
          id="projects-tab"
          data-testid="projects-tab"
          tabContentId="projects-tab-content"
        />
      </Tabs>
      <div>
        <TabContent
          id="users-tab-content"
          eventKey="users"
          hidden={activeTabKey !== 'users'}
          data-testid="users-tab-content"
        >
          <TabContentBody>
            <RoleBindingPermissions
              ownerReference={ownerReference}
              defaultRoleBindingName={`${mrName ?? ''}-users`}
              isGroupFirst
              permissionOptions={[
                {
                  type: RoleBindingPermissionsRoleType.DEFAULT,
                  description: 'Default role for all users',
                },
              ]}
              roleRefKind="Role"
              roleRefName={`registry-user-${mrName ?? ''}`}
              labels={{
                [KnownLabels.DASHBOARD_RESOURCE]: 'true',
                app: mrName || '',
                'app.kubernetes.io/component': SupportedArea.MODEL_REGISTRY,
                'app.kubernetes.io/part-of': SupportedArea.MODEL_REGISTRY,
                'app.kubernetes.io/name': mrName || '',
                component: SupportedArea.MODEL_REGISTRY,
              }}
              projectName={modelRegistryNamespace}
              description={
                <>
                  To enable access for all cluster users, add{' '}
                  <ClipboardCopy variant="inline-compact">system:authenticated</ClipboardCopy> to
                  the group list.
                </>
              }
              roleBindingPermissionsRB={{ ...roleBindings, data: filteredRoleBindings }}
              groups={safeGroups}
              createRoleBinding={createModelRegistryRoleBinding}
              deleteRoleBinding={deleteModelRegistryRoleBinding}
            />
          </TabContentBody>
        </TabContent>
        <TabContent
          id="projects-tab-content"
          eventKey="projects"
          data-testid="projects-tab-content"
          hidden={activeTabKey !== 'projects'}
        >
          <TabContentBody>
            <ProjectsSettingsTab
              ownerReference={ownerReference}
              permissionOptions={[
                {
                  type: RoleBindingPermissionsRoleType.DEFAULT,
                  description: 'Default role for all projects',
                },
              ]}
              description="To enable access for all service accounts in a project, add the project name to the projects list."
              roleRefName={`registry-user-${mrName ?? ''}`}
              labels={{
                [KnownLabels.DASHBOARD_RESOURCE]: 'true',
                [KnownLabels.PROJECT_SUBJECT]: 'true',
                app: mrName || '',
                'app.kubernetes.io/component': SupportedArea.MODEL_REGISTRY,
                'app.kubernetes.io/part-of': SupportedArea.MODEL_REGISTRY,
                'app.kubernetes.io/name': mrName || '',
                component: SupportedArea.MODEL_REGISTRY,
              }}
              projectName={modelRegistryNamespace}
              isProjectSubject={activeTabKey === 'projects'}
              roleBindingPermissionsRB={{ ...roleBindings, data: filteredRoleBindings }}
            />
          </TabContentBody>
        </TabContent>
      </div>
    </ApplicationsPage>
  );
};

export default ModelRegistriesManagePermissions;
