import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import type { RunDateTime } from '@odh-dashboard/dashboard-foundation-frontend/utilities/pipelinePeriodicSchedule';
import { isStartBeforeEnd } from '@odh-dashboard/pipelines/concepts/content/createRun/utils';

type EndDateBeforeStartDateErrorProps = {
  start?: RunDateTime;
  end?: RunDateTime;
};

const EndDateBeforeStartDateError: React.FC<EndDateBeforeStartDateErrorProps> = ({
  start,
  end,
}) => {
  const isValid = isStartBeforeEnd(start, end);

  if (isValid) {
    return null;
  }

  return <Alert isInline isPlain variant="danger" title="End date must be after start date." />;
};

export default EndDateBeforeStartDateError;
