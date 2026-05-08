import {
  Breadcrumb,
  Divider,
  ContentVariants,
  Flex,
  FlexItem,
  Content,
} from '@patternfly/react-core';
import React from 'react';
import { Link } from 'react-router-dom';
import { IconSize } from '@odh-dashboard/dashboard-foundation-frontend/types.ts';
import { ProjectIconWithSize } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/ProjectIconWithSize.tsx';
import { getDisplayNameFromK8sResource } from '@odh-dashboard/dashboard-foundation-frontend/concepts/k8s/utils.ts';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import '#~/pages/pipelines/global/GlobalPipelineCoreDetails.scss';

type PipelineContextBreadcrumbProps = {
  children: React.ReactNode;
  dataTestId?: string;
};

const PipelineContextBreadcrumb: React.FC<PipelineContextBreadcrumbProps> = ({
  children,
  dataTestId,
}) => {
  const { project } = usePipelinesAPI();

  return (
    <Flex>
      <Breadcrumb data-testid={dataTestId}>{children}</Breadcrumb>
      <Flex>
        <Divider orientation={{ default: 'vertical' }} />
        <FlexItem data-testid="project-navigator-link-in-breadcrumb">
          <Content component={ContentVariants.small}>
            <Link to={`/projects/${project.metadata.name}`} className="link-button-with-icon">
              <Flex
                alignItems={{ default: 'alignItemsCenter' }}
                spaceItems={{ default: 'spaceItemsXs' }}
              >
                <FlexItem>Go to</FlexItem>
                <ProjectIconWithSize size={IconSize.MD} />
                <FlexItem>
                  <strong>{getDisplayNameFromK8sResource(project)}</strong>
                </FlexItem>
              </Flex>
            </Link>
          </Content>
        </FlexItem>
      </Flex>
    </Flex>
  );
};

export default PipelineContextBreadcrumb;
