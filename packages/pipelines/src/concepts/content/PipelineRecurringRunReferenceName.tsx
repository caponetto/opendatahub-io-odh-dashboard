import React from 'react';
import { Content, ContentVariants } from '@patternfly/react-core';
import { getPipelineRecurringRunExecutionCount } from '@odh-dashboard/pipelines/concepts/content/tables/utils';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';

type PipelineRecurringRunReferenceNameProps = {
  runName: string;
  recurringRunId?: string;
};

const PipelineRecurringRunReferenceName: React.FC<PipelineRecurringRunReferenceNameProps> = ({
  runName,
  recurringRunId,
}) => {
  const { getRecurringRunInformation } = usePipelinesAPI();
  const { data, loading } = getRecurringRunInformation(recurringRunId);

  return (
    <>
      {loading ? (
        'loading...'
      ) : data ? (
        <Content component={ContentVariants.p} className="pf-v6-u-pb-sm">
          Run {getPipelineRecurringRunExecutionCount(runName)} of {data.display_name}
        </Content>
      ) : (
        ''
      )}
    </>
  );
};
export default PipelineRecurringRunReferenceName;
