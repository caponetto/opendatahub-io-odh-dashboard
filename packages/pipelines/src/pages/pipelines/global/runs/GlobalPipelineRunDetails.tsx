import React from 'react';
import { useParams } from 'react-router-dom';
import {
  globalArchivedPipelineRunsRoute,
  globalPipelineRunsRoute,
} from '@odh-dashboard/pipelines/routes/runs';
import PipelineRunDetails from '@odh-dashboard/pipelines/concepts/content/pipelinesDetails/pipelineRun/PipelineRunDetails';
import { BreadcrumbDetailsComponentProps } from '@odh-dashboard/pipelines/concepts/content/types';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import usePipelineRunById from '@odh-dashboard/pipelines/concepts/apiHooks/usePipelineRunById';
import { StorageStateKF } from '@odh-dashboard/pipelines/concepts/kfTypes';

const GlobalPipelineRunDetails: BreadcrumbDetailsComponentProps = ({
  breadcrumbPath,
  setHomePath,
}) => {
  const { runId } = useParams();
  const fetchedRun = usePipelineRunById(runId, true);
  const { namespace } = usePipelinesAPI();
  const [run] = fetchedRun;
  const isRunArchived = run?.storage_state === StorageStateKF.ARCHIVED;
  const contextPath = isRunArchived
    ? globalArchivedPipelineRunsRoute(namespace)
    : globalPipelineRunsRoute(namespace);

  React.useEffect(() => {
    setHomePath(contextPath);
  }, [contextPath, setHomePath]);

  return (
    <PipelineRunDetails
      breadcrumbPath={breadcrumbPath}
      contextPath={contextPath}
      fetchedRun={fetchedRun}
    />
  );
};

export default GlobalPipelineRunDetails;
