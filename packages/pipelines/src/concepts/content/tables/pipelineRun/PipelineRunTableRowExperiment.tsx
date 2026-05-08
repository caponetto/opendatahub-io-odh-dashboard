import React from 'react';
import { Label, Skeleton, Split, SplitItem } from '@patternfly/react-core';
import TruncatedText from '@odh-dashboard/dashboard-foundation-frontend/components/TruncatedText';
import { ExperimentKF } from '@odh-dashboard/pipelines/concepts/kfTypes';
import { NoRunContent } from '@odh-dashboard/pipelines/concepts/content/tables/renderUtils';

type PipelineRunTableRowExperimentProps = {
  experiment?: ExperimentKF | null;
  isExperimentArchived?: boolean;
  loaded: boolean;
  error?: Error;
  onClick?: () => void;
};

const PipelineRunTableRowExperiment: React.FC<PipelineRunTableRowExperimentProps> = ({
  experiment,
  isExperimentArchived,
  loaded,
  error,
  onClick,
}) => {
  if (!loaded && !error) {
    return <Skeleton />;
  }

  if (!experiment) {
    return <NoRunContent />;
  }

  const runGroupLabel = (
    <Label
      {...(onClick
        ? {
            isClickable: true,
            onClick,
          }
        : {})}
      isCompact
      variant="outline"
    >
      <TruncatedText content={experiment.display_name} maxLines={1} />
    </Label>
  );

  return (
    <Split hasGutter>
      <SplitItem>{runGroupLabel}</SplitItem>
      {isExperimentArchived && (
        <SplitItem>
          <Label variant="outline" isCompact>
            Archived
          </Label>
        </SplitItem>
      )}
    </Split>
  );
};

export default PipelineRunTableRowExperiment;
