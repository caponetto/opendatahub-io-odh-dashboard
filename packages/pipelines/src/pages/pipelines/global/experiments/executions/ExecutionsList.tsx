import * as React from 'react';
import { Bullseye, EmptyState, EmptyStateBody, Spinner } from '@patternfly/react-core';
import { ExclamationCircleIcon, PlusCircleIcon } from '@patternfly/react-icons';
import { getGenericErrorCode } from '@odh-dashboard/dashboard-foundation-frontend/api/errorUtils';
import UnauthorizedError from '@odh-dashboard/dashboard-foundation-frontend/components/UnauthorizedError';
import { useGetExecutionsList } from '@odh-dashboard/pipelines/concepts/apiHooks/mlmd/useGetExecutionsList';
import ExecutionsTable from '@odh-dashboard/pipelines/pages/pipelines/global/experiments/executions/ExecutionsTable';
import { useMlmdListContext } from '@odh-dashboard/pipelines/concepts/context';

const ExecutionsList: React.FC = () => {
  const { filterQuery } = useMlmdListContext();
  const [executionsResponse, isExecutionsLoaded, executionsError] = useGetExecutionsList();
  const { executions, nextPageToken } = executionsResponse || { executions: [] };
  const filterQueryRef = React.useRef(filterQuery);

  if (executionsError) {
    if (getGenericErrorCode(executionsError) === 403) {
      return <UnauthorizedError accessDomain="executions" />;
    }
    return (
      <Bullseye>
        <EmptyState
          headingLevel="h2"
          icon={ExclamationCircleIcon}
          titleText="There was an issue loading executions"
        >
          <EmptyStateBody>{executionsError.message}</EmptyStateBody>
        </EmptyState>
      </Bullseye>
    );
  }

  if (!isExecutionsLoaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (!executions.length && !filterQuery && filterQueryRef.current === filterQuery) {
    return (
      <EmptyState
        headingLevel="h4"
        icon={PlusCircleIcon}
        titleText="No executions"
        data-testid="global-no-executions"
      >
        <EmptyStateBody>
          No experiments have been executed within this project. Select a different project, or
          execute an experiment from the <b>Experiments</b> page.
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <ExecutionsTable
      executions={executions}
      nextPageToken={nextPageToken}
      isLoaded={isExecutionsLoaded}
    />
  );
};
export default ExecutionsList;
