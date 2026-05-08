import * as React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  Flex,
  FlexItem,
  Truncate,
  Alert,
  AlertActionCloseButton,
  Popover,
  Button,
  ListItem,
  List,
} from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import { Link, useSearchParams } from 'react-router-dom';
import ApplicationsPage from '@odh-dashboard/dashboard-foundation-frontend/components/ApplicationsPage';
import { ProjectDetailsContext } from '@odh-dashboard/projects-shared/concepts/projects/ProjectDetailsContext';
import {
  SupportedArea,
  useIsAreaAvailable,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import {
  ProjectObjectType,
  SectionType,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/utils';
import { ProjectSectionID } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/projectSectionId';
import {
  getDescriptionFromK8sResource,
  getDisplayNameFromK8sResource,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/k8s/utils';
import ResourceNameTooltip from '@odh-dashboard/dashboard-foundation-frontend/components/ResourceNameTooltip';
import HeaderIcon from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/HeaderIcon';
import { useProjectPermissionsTabVisible } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/accessChecks';
import { useKueueConfiguration } from '@odh-dashboard/distributed-workloads-shared/concepts/kueue/kueueUtils';
import { PermissionsContextProvider } from '@odh-dashboard/dashboard-foundation-frontend/concepts/permissions/PermissionsContext';
import ProjectSettingsPage from '@odh-dashboard/workbenches/pages/projectSettings/ProjectSettingsPage';
import ProjectPermissions from '@odh-dashboard/workbenches/pages/projectPermissions/ProjectPermissions';
import ProjectSharing from '@odh-dashboard/workbenches/pages/projectSharing/ProjectSharing';
import GenericHorizontalBar from '@odh-dashboard/workbenches/pages/components/GenericHorizontalBar';
import { useDeploymentsTab } from '@odh-dashboard/workbenches/concepts/projects/projectDetails/useDeploymentsTab';
import { PipelinesSectionWrapper as PipelinesSection } from '@odh-dashboard/workbenches/concepts/usePipelinesIntegration';
import useCheckLogoutParams from './useCheckLogoutParams';
import ProjectOverview from './overview/ProjectOverview';
import NotebookList from './notebooks/NotebookList';
import StorageList from './storage/StorageList';
import ConnectionsList from './connections/ConnectionsList';
import ProjectActions from './ProjectActions';

import './ProjectDetails.scss';

const ProjectDetails: React.FC = () => {
  const { currentProject } = React.useContext(ProjectDetailsContext);
  const displayName = getDisplayNameFromK8sResource(currentProject);
  const description = getDescriptionFromK8sResource(currentProject);
  const biasMetricsAreaAvailable = useIsAreaAvailable(SupportedArea.BIAS_METRICS).status;
  const projectSharingEnabled = useIsAreaAvailable(SupportedArea.DS_PROJECTS_PERMISSIONS).status;
  const pipelinesEnabled = useIsAreaAvailable(SupportedArea.DS_PIPELINES).status;
  const projectRBACEnabled = useIsAreaAvailable(SupportedArea.PROJECT_RBAC_SETTINGS).status;
  const deploymentsTab = useDeploymentsTab();
  const [searchParams, setSearchParams] = useSearchParams();
  const state = searchParams.get('section');

  const [allowCreate, rbacLoaded] = useProjectPermissionsTabVisible(currentProject.metadata.name);

  const workbenchEnabled = useIsAreaAvailable(SupportedArea.WORKBENCHES).status;

  useCheckLogoutParams();

  const { isKueueDisabled } = useKueueConfiguration(currentProject);

  const [isKueueAlertDismissed, setIsKueueAlertDismissed] = React.useState(false);

  const handleKueueAlertClose = React.useCallback(() => {
    setIsKueueAlertDismissed(true);
  }, []);

  return (
    <ApplicationsPage
      title={
        <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
          <HeaderIcon type={ProjectObjectType.projectContext} sectionType={SectionType.general} />
          <FlexItem flex={{ default: 'flex_1' }}>
            <ResourceNameTooltip resource={currentProject} wrap={false}>
              <Truncate content={displayName} />
            </ResourceNameTooltip>
          </FlexItem>
        </Flex>
      }
      description={<div style={{ marginLeft: 40 }}>{description}</div>}
      breadcrumb={
        <Breadcrumb>
          <BreadcrumbItem render={() => <Link to="/projects">Projects</Link>} />
          <BreadcrumbItem isActive style={{ maxWidth: 300 }}>
            <Truncate content={displayName} />
          </BreadcrumbItem>
        </Breadcrumb>
      }
      loaded={rbacLoaded}
      empty={false}
      headerAction={<ProjectActions project={currentProject} />}
    >
      {isKueueDisabled && !isKueueAlertDismissed && (
        <Flex direction={{ default: 'column' }} className="pf-v6-u-px-lg">
          <Alert
            data-testid="kueue-disabled-alert-project-details"
            variant="info"
            isInline
            title="Kueue is disabled in this cluster"
            isExpandable
            actionClose={<AlertActionCloseButton onClose={handleKueueAlertClose} />}
          >
            <p>
              This project uses local queue for workload allocation, which relies on Kueue. To
              deploy a model or create a workbench in this project, ask your administrator to enable
              Kueue or change this project&apos;s workload allocation strategy.
            </p>
            <Popover
              position="bottom"
              headerContent="Who's my administrator?"
              bodyContent={
                <div>
                  Your administrator might be:
                  <List>
                    <ListItem>
                      The person who assigned you your username, or who helped you log in for the
                      first time
                    </ListItem>
                    <ListItem>Someone in your IT department or help desk</ListItem>
                    <ListItem>A project manager or developer</ListItem>
                    <ListItem>Your professor (at a school)</ListItem>
                  </List>
                </div>
              }
            >
              <Button variant="link" icon={<OutlinedQuestionCircleIcon />} aria-label="More info">
                Who&apos;s my administrator?
              </Button>
            </Popover>
          </Alert>
        </Flex>
      )}

      <GenericHorizontalBar
        activeKey={state}
        onSectionChange={React.useCallback(
          (sectionId, replace) => {
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.set('section', sectionId);
            setSearchParams(newSearchParams, replace ? { replace } : undefined);
          },
          [searchParams, setSearchParams],
        )}
        sections={React.useMemo(
          () => [
            { id: ProjectSectionID.OVERVIEW, title: 'Overview', component: <ProjectOverview /> },
            ...(workbenchEnabled
              ? [
                  {
                    id: ProjectSectionID.WORKBENCHES,
                    title: 'Workbenches',
                    component: <NotebookList />,
                  },
                ]
              : []),
            ...(pipelinesEnabled
              ? [
                  {
                    id: ProjectSectionID.PIPELINES,
                    title: 'Pipelines',
                    component: <PipelinesSection />,
                  },
                ]
              : []),
            ...deploymentsTab,
            {
              id: ProjectSectionID.CLUSTER_STORAGES,
              title: 'Cluster storage',
              component: <StorageList />,
            },
            {
              id: ProjectSectionID.CONNECTIONS,
              title: 'Connections',
              component: <ConnectionsList />,
            },
            ...(projectSharingEnabled && allowCreate
              ? [
                  {
                    id: ProjectSectionID.PERMISSIONS,
                    title: 'Permissions',
                    component: projectRBACEnabled ? (
                      <PermissionsContextProvider namespace={currentProject.metadata.name}>
                        <ProjectPermissions />
                      </PermissionsContextProvider>
                    ) : (
                      <ProjectSharing />
                    ),
                  },
                ]
              : []),
            ...(biasMetricsAreaAvailable && allowCreate
              ? [
                  {
                    id: ProjectSectionID.SETTINGS,
                    title: 'Settings',
                    component: <ProjectSettingsPage />,
                  },
                ]
              : []),
          ],
          [
            workbenchEnabled,
            pipelinesEnabled,
            deploymentsTab,
            projectSharingEnabled,
            allowCreate,
            projectRBACEnabled,
            currentProject.metadata.name,
            biasMetricsAreaAvailable,
          ],
        )}
      />
    </ApplicationsPage>
  );
};

export default ProjectDetails;
