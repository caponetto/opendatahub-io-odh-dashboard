import React from 'react';
import { PipelineRunType } from '@odh-dashboard/pipelines/pages/pipelines/global/runs/types';
import GlobalPipelineRunsTabs from '@odh-dashboard/pipelines/pages/pipelines/global/runs/GlobalPipelineRunsTabs';
import { ExperimentContext } from '@odh-dashboard/pipelines/pages/pipelines/global/experiments/ExperimentContext';

type ExperimentPipelineRunsTabsProps = {
  tab: PipelineRunType;
};

const ExperimentPipelineRunsTabs: React.FC<ExperimentPipelineRunsTabsProps> = ({ tab }) => {
  const { basePath } = React.useContext(ExperimentContext);

  return <GlobalPipelineRunsTabs basePath={basePath} tab={tab} />;
};

export default ExperimentPipelineRunsTabs;
