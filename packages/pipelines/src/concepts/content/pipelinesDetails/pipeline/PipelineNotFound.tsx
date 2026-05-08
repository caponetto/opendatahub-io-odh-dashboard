import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateActions,
  EmptyStateFooter,
} from '@patternfly/react-core';
import { CubesIcon } from '@patternfly/react-icons';
import { pipelinesBaseRoute } from '@odh-dashboard/pipelines-shared/concepts/pipelines/routes';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';

const PipelineNotFound: React.FC = () => {
  const { namespace } = usePipelinesAPI();
  return (
    <EmptyState headingLevel="h4" icon={CubesIcon} titleText="Pipeline version not found">
      <EmptyStateBody>To see more pipelines navigate to the pipelines page</EmptyStateBody>
      <EmptyStateFooter>
        <EmptyStateActions>
          <Button
            variant="primary"
            component={(props: React.ComponentProps<'a'>) => (
              <Link {...props} to={pipelinesBaseRoute(namespace)} />
            )}
          >
            See all pipelines
          </Button>
        </EmptyStateActions>
      </EmptyStateFooter>
    </EmptyState>
  );
};
export default PipelineNotFound;
