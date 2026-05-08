import React from 'react';
import { useParams } from 'react-router-dom';

import {
  BreadcrumbItem,
  Bullseye,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  Spinner,
  Tab,
  TabTitleText,
  Tabs,
  Truncate,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';

import ApplicationsPage from '@odh-dashboard/dashboard-foundation-frontend/components/ApplicationsPage';
import {
  SupportedArea,
  useIsAreaAvailable,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import { PipelineCoreDetailsPageComponent } from '@odh-dashboard/pipelines/concepts/content/types';
import {
  getArtifactName,
  getIsArtifactModelRegistered,
} from '@odh-dashboard/pipelines/pages/pipelines/global/experiments/artifacts/utils';
import { ArtifactDetailsTabKey } from '@odh-dashboard/pipelines/pages/pipelines/global/experiments/artifacts/constants';
import { useGetArtifactById } from '@odh-dashboard/pipelines/concepts/apiHooks/mlmd/useGetArtifactById';
import PipelineContextBreadcrumb from '@odh-dashboard/pipelines/concepts/content/PipelineContextBreadcrumb';
import { ArtifactOverviewDetails } from './ArtifactOverviewDetails';
import ArtifactDetailsTitle from './ArtifactDetailsTitle';

export const ArtifactDetails: PipelineCoreDetailsPageComponent = ({ breadcrumbPath }) => {
  const { artifactId } = useParams();
  const [artifact, isArtifactLoaded, artifactError] = useGetArtifactById(Number(artifactId));
  const artifactName = getArtifactName(artifact);
  const { status: modelRegistryAvailable } = useIsAreaAvailable(SupportedArea.MODEL_REGISTRY);
  const isArtifactModelRegistered = modelRegistryAvailable
    ? getIsArtifactModelRegistered(artifact)
    : false;

  if (artifactError) {
    return (
      <EmptyState
        headingLevel="h4"
        icon={ExclamationCircleIcon}
        titleText="Error loading artifact details"
        variant={EmptyStateVariant.lg}
      >
        <EmptyStateBody>{artifactError.message}</EmptyStateBody>
      </EmptyState>
    );
  }

  if (!isArtifactLoaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  return (
    <ApplicationsPage
      title={
        <ArtifactDetailsTitle
          name={artifactName}
          isArtifactModelRegistered={isArtifactModelRegistered}
        />
      }
      loaded={isArtifactLoaded}
      loadError={artifactError}
      breadcrumb={
        <PipelineContextBreadcrumb>
          {breadcrumbPath}
          <BreadcrumbItem isActive style={{ maxWidth: 300 }}>
            <Truncate content={artifactName} />
          </BreadcrumbItem>
        </PipelineContextBreadcrumb>
      }
      empty={false}
      provideChildrenPadding
    >
      <Tabs aria-label="Artifact details tabs" activeKey={ArtifactDetailsTabKey.Overview}>
        <Tab
          eventKey={ArtifactDetailsTabKey.Overview}
          title={<TabTitleText>Overview</TabTitleText>}
          aria-label="Overview"
        >
          <ArtifactOverviewDetails artifact={artifact} />
        </Tab>
        <Tab
          eventKey={ArtifactDetailsTabKey.LineageExplorer}
          title={<TabTitleText>Lineage explorer</TabTitleText>}
          isAriaDisabled
        />
      </Tabs>
    </ApplicationsPage>
  );
};
