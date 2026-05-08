import * as React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import {
  byName,
  ProjectsContext,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/ProjectsContext';
import InvalidProject from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/InvalidProject';
import ApplicationsPage from '@odh-dashboard/dashboard-foundation-frontend/components/ApplicationsPage';
import { MetricsCommonContextProvider } from '@odh-dashboard/dashboard-foundation-frontend/concepts/metrics/MetricsCommonContext';
import { RefreshIntervalTitle } from '@odh-dashboard/dashboard-foundation-frontend/concepts/metrics/types';
import ProjectSelectorNavigator from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/ProjectSelectorNavigator';
import TitleWithIcon from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/TitleWithIcon';
import { ProjectObjectType } from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/utils';
import GlobalDistributedWorkloadsTabs from '@odh-dashboard/distributed-workloads/pages/distributedWorkloads/global/GlobalDistributedWorkloadsTabs';
import DistributedWorkloadsNoProjects from '@odh-dashboard/distributed-workloads/pages/distributedWorkloads/global/DistributedWorkloadsNoProjects';
import { DistributedWorkloadsTabConfig } from '@odh-dashboard/distributed-workloads/pages/distributedWorkloads/global/useDistributedWorkloadsTabs';
import { DistributedWorkloadsContextProvider } from '@odh-dashboard/distributed-workloads/concepts/DistributedWorkloadsContext';

const title = 'Workload metrics';
const description = 'Monitor the metrics of your active resources.';

type GlobalDistributedWorkloadsProps = {
  activeTab: DistributedWorkloadsTabConfig;
  getInvalidRedirectPath: (namespace: string) => string;
};

const GlobalDistributedWorkloads: React.FC<GlobalDistributedWorkloadsProps> = ({
  activeTab,
  getInvalidRedirectPath,
}) => {
  const { namespace } = useParams<{ namespace: string }>();
  const { projects, preferredProject } = React.useContext(ProjectsContext);

  if (projects.length === 0) {
    return (
      <ApplicationsPage
        title={<TitleWithIcon title={title} objectType={ProjectObjectType.distributedWorkload} />}
        description={description}
        loaded
        empty
        emptyStatePage={<DistributedWorkloadsNoProjects />}
      />
    );
  }
  if (!namespace) {
    const redirectProject = preferredProject ?? projects[0];
    return <Navigate to={getInvalidRedirectPath(redirectProject.metadata.name)} replace />;
  }
  if (namespace && !projects.find(byName(namespace))) {
    // The namespace in the URL is invalid
    return (
      <ApplicationsPage
        title={<TitleWithIcon title={title} objectType={ProjectObjectType.distributedWorkload} />}
        description={description}
        loaded
        empty
        emptyStatePage={
          <InvalidProject namespace={namespace} getRedirectPath={getInvalidRedirectPath} />
        }
      />
    );
  }

  // We're all good, we have a namespace matching a known project
  return (
    <ApplicationsPage
      title={<TitleWithIcon title={title} objectType={ProjectObjectType.distributedWorkload} />}
      description={description}
      loaded
      empty={false}
      headerContent={
        <ProjectSelectorNavigator
          getRedirectPath={(ns: string) =>
            `/observe-monitor/workload-metrics/${activeTab.path}/${ns}`
          }
          showTitle
        />
      }
    >
      <MetricsCommonContextProvider initialRefreshInterval={RefreshIntervalTitle.THIRTY_MINUTES}>
        <DistributedWorkloadsContextProvider namespace={namespace}>
          <GlobalDistributedWorkloadsTabs activeTabId={activeTab.id} />
        </DistributedWorkloadsContextProvider>
      </MetricsCommonContextProvider>
    </ApplicationsPage>
  );
};

export default GlobalDistributedWorkloads;
