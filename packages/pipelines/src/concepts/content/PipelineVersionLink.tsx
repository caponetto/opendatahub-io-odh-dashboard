import React from 'react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@patternfly/react-core';
import { TableText } from '@patternfly/react-table';
import { pipelineVersionDetailsRoute } from '@odh-dashboard/pipelines/routes/global';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import { PipelineVersionKF } from '@odh-dashboard/pipelines/concepts/kfTypes';
import { NoRunContent } from './tables/renderUtils';

interface PipelineVersionLinkProps {
  loadingIndicator?: React.ReactElement;
  version?: PipelineVersionKF | null;
  error?: Error;
  loaded: boolean;
}

export const PipelineVersionLink: React.FC<PipelineVersionLinkProps> = ({
  loadingIndicator,
  version,
  error,
  loaded,
}) => {
  const { namespace } = usePipelinesAPI();

  if (!loaded && !error) {
    return loadingIndicator || <Skeleton />;
  }

  if (!version) {
    return <NoRunContent />;
  }

  return (
    <Link
      to={pipelineVersionDetailsRoute(namespace, version.pipeline_id, version.pipeline_version_id)}
    >
      <TableText wrapModifier="truncate">{version.display_name}</TableText>
    </Link>
  );
};
