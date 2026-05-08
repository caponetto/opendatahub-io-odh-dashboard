import * as React from 'react';
import { Td, Tr } from '@patternfly/react-table';
import { Link } from 'react-router-dom';
import { executionDetailsRoute } from '@odh-dashboard/pipelines/routes/executions';
import { getExecutionDisplayName } from '@odh-dashboard/pipelines/pages/pipelines/global/experiments/executions/utils';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import { ExecutionStatus } from '@odh-dashboard/pipelines/pages/pipelines/global/experiments/executions/ExecutionStatus';
import { Execution } from '../../../../../third_party/mlmd';

type ExecutionsTableRowProps = {
  obj: Execution;
};

const ExecutionsTableRow: React.FC<ExecutionsTableRowProps> = ({ obj }) => {
  const { namespace } = usePipelinesAPI();
  return (
    <Tr>
      <Td dataLabel="Executions">
        <Link to={executionDetailsRoute(namespace, obj.getId().toString())}>
          {getExecutionDisplayName(obj)}
        </Link>
      </Td>
      <Td dataLabel="Status">
        <ExecutionStatus status={obj.getLastKnownState()} isCompact />
      </Td>
      <Td dataLabel="ID">{obj.getId()}</Td>
      <Td dataLabel="Type">{obj.getType()}</Td>
    </Tr>
  );
};

export default ExecutionsTableRow;
