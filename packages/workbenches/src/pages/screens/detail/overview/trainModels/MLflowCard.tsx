import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Content,
  Flex,
  FlexItem,
  Title,
} from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import {
  ProjectObjectType,
  SectionType,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/utils.ts';
import HeaderIcon from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/HeaderIcon';
import { useWatchConsoleLinks } from '@odh-dashboard/dashboard-foundation-frontend/utilities/useWatchConsoleLinks';
import { isMLflowConsoleLink } from '@odh-dashboard/mlflow-shared/utilities/mlflowUtils';
import { ProjectDetailsContext } from '@odh-dashboard/projects-shared/concepts/projects/ProjectDetailsContext';
import { fireLinkTrackingEvent } from '@odh-dashboard/dashboard-foundation-frontend/concepts/analyticsTracking/segmentIOUtils';
import {
  mlflowExperimentsPath,
  WORKSPACE_QUERY_PARAM,
} from '@odh-dashboard/mlflow-shared/concepts/mlflow/routes';

const MLFLOW_DEFAULT_PATH = '/experiments';

export const setWorkspaceQueryParam = (hashPathQuery: string, workspace: string): string => {
  const queryIndex = hashPathQuery.indexOf('?');
  const pathname = queryIndex === -1 ? hashPathQuery : hashPathQuery.slice(0, queryIndex);
  const existingQuery = queryIndex === -1 ? '' : hashPathQuery.slice(queryIndex + 1);
  const params = new URLSearchParams(existingQuery);
  params.set(WORKSPACE_QUERY_PARAM, workspace);
  return `${pathname}?${params.toString()}`;
};

export const buildMLflowExperimentsWorkspaceHref = (href: string, projectName: string): string => {
  const base = href.replace(/\/+$/, '');
  const hashPath = setWorkspaceQueryParam(MLFLOW_DEFAULT_PATH, projectName);
  return `${base}/#${hashPath}`;
};

const MLflowCard: React.FC = () => {
  const { currentProject } = React.useContext(ProjectDetailsContext);
  const { consoleLinks } = useWatchConsoleLinks();
  const mlflowLink = consoleLinks.find((link) => isMLflowConsoleLink(link.metadata?.name));
  const projectName = currentProject.metadata.name;

  if (!mlflowLink) {
    return null;
  }

  const mlflowWorkspaceHref = projectName
    ? buildMLflowExperimentsWorkspaceHref(mlflowLink.spec.href, projectName)
    : mlflowLink.spec.href;

  return (
    <Card>
      <CardHeader>
        <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            <HeaderIcon type={ProjectObjectType.mlflow} sectionType={SectionType.training} />
          </FlexItem>
          <FlexItem>
            <Title headingLevel="h1" size="xl">
              Experiment tracking
            </Title>
          </FlexItem>
        </Flex>
      </CardHeader>
      <CardBody>
        <Content component="p" style={{ maxWidth: '620px' }}>
          Track your pipeline experiments with the embedded MLflow experience on the{' '}
          <strong>Experiments</strong> page, or launch MLflow in a new tab.
        </Content>
      </CardBody>
      <CardFooter>
        <Flex gap={{ default: 'gapMd' }}>
          <FlexItem>
            <Button
              data-testid="embedded-mlflow-experiments-link"
              variant="link"
              component={(props: React.ComponentProps<'a'>) => (
                <Link {...props} to={mlflowExperimentsPath} />
              )}
            >
              Go to <strong>Experiments</strong>
            </Button>
          </FlexItem>
          <FlexItem>
            <Button
              data-testid="mlflow-jump-link"
              component="a"
              variant="link"
              href={mlflowWorkspaceHref}
              target="_blank"
              rel="noopener noreferrer"
              icon={<ExternalLinkAltIcon />}
              iconPosition="right"
              onClick={() =>
                fireLinkTrackingEvent('Launch MLflow clicked', {
                  from: window.location.pathname,
                  href: mlflowWorkspaceHref,
                  section: 'project-overview',
                })
              }
            >
              Launch MLflow
            </Button>
          </FlexItem>
        </Flex>
      </CardFooter>
    </Card>
  );
};

export default MLflowCard;
