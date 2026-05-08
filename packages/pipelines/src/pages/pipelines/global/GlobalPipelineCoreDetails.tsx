import * as React from 'react';
import { Link } from 'react-router-dom';
import { BreadcrumbItem, Flex, FlexItem } from '@patternfly/react-core';
import { getDisplayNameFromK8sResource } from '@odh-dashboard/dashboard-foundation-frontend/concepts/k8s/utils';
import { ProjectIconWithSize } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/ProjectIconWithSize';
import { IconSize } from '@odh-dashboard/dashboard-foundation-frontend/types';
import { pipelinesBaseRoute } from '@odh-dashboard/pipelines-shared/concepts/pipelines/routes';
import { experimentsBaseRoute } from '@odh-dashboard/pipelines/routes/experiments';
import { pipelineRunsBaseRoute } from '@odh-dashboard/pipelines/routes/runs';
import EnsureCompatiblePipelineServer from '@odh-dashboard/pipelines/concepts/EnsureCompatiblePipelineServer';
import EnsureAPIAvailability from '@odh-dashboard/pipelines/concepts/EnsureAPIAvailability';
import { BreadcrumbDetailsComponentProps } from '@odh-dashboard/pipelines/concepts/content/types';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';

import './GlobalPipelineCoreDetails.scss';

export type GlobalPipelineCoreDetailsProps = {
  pageName: string;
  redirectPath: (namespace: string) => string;
  BreadcrumbDetailsComponent: BreadcrumbDetailsComponentProps;
};

const GlobalPipelineCoreDetails: React.FC<GlobalPipelineCoreDetailsProps> = (props) => (
  <EnsureAPIAvailability>
    <EnsureCompatiblePipelineServer>
      <GlobalPipelineCoreDetailsInner {...props} />
    </EnsureCompatiblePipelineServer>
  </EnsureAPIAvailability>
);

const GlobalPipelineCoreDetailsInner: React.FC<GlobalPipelineCoreDetailsProps> = ({
  pageName,
  redirectPath,
  BreadcrumbDetailsComponent,
}) => {
  const { namespace, project } = usePipelinesAPI();
  // Use this value to reset home link path
  // e.g. Navigate to archived/schedules tab for pipeline run details
  const [homePath, setHomePath] = React.useState(redirectPath(namespace));

  return (
    <BreadcrumbDetailsComponent
      breadcrumbPath={[
        <BreadcrumbItem
          key="home"
          render={() => (
            <Link to={homePath} className="link-button-with-icon">
              <Flex
                alignItems={{ default: 'alignItemsCenter' }}
                spaceItems={{ default: 'spaceItemsXs' }}
              >
                <FlexItem>{pageName} in</FlexItem>
                <ProjectIconWithSize size={IconSize.MD} />
                <FlexItem>{getDisplayNameFromK8sResource(project)}</FlexItem>
              </Flex>
            </Link>
          )}
        />,
      ]}
      contextPath={homePath}
      setHomePath={setHomePath}
    />
  );
};

export const PipelineVersionCoreDetails: React.FC<
  Pick<GlobalPipelineCoreDetailsProps, 'BreadcrumbDetailsComponent'>
> = ({ BreadcrumbDetailsComponent }) => (
  <GlobalPipelineCoreDetailsInner
    pageName="Pipeline definitions"
    redirectPath={pipelinesBaseRoute}
    BreadcrumbDetailsComponent={BreadcrumbDetailsComponent}
  />
);

export const ExperimentCoreDetails: React.FC<
  Pick<GlobalPipelineCoreDetailsProps, 'BreadcrumbDetailsComponent'>
> = ({ BreadcrumbDetailsComponent }) => (
  <GlobalPipelineCoreDetailsInner
    pageName="Experiments"
    redirectPath={experimentsBaseRoute}
    BreadcrumbDetailsComponent={BreadcrumbDetailsComponent}
  />
);

export const PipelineRunCoreDetails: React.FC<
  Pick<GlobalPipelineCoreDetailsProps, 'BreadcrumbDetailsComponent'>
> = ({ BreadcrumbDetailsComponent }) => (
  <GlobalPipelineCoreDetailsInner
    pageName="Runs"
    redirectPath={pipelineRunsBaseRoute}
    BreadcrumbDetailsComponent={BreadcrumbDetailsComponent}
  />
);

export default GlobalPipelineCoreDetails;
