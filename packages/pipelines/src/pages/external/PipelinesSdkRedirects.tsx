import React from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { Button } from '@patternfly/react-core';
import ApplicationsPage from '@odh-dashboard/dashboard-foundation-frontend/components/ApplicationsPage';
import { useRedirect } from '@odh-dashboard/dashboard-foundation-frontend/utilities/useRedirect';
import RedirectErrorState from '@odh-dashboard/dashboard-foundation-frontend/pages/external/RedirectErrorState';
import { pipelinesRootPath } from '@odh-dashboard/pipelines-shared/concepts/pipelines/routes';
import {
  experimentRunsRoute,
  experimentsRootPath,
} from '@odh-dashboard/pipelines/routes/experiments';
import { globalPipelineRunDetailsRoute } from '@odh-dashboard/pipelines/routes/runs';

/**
 * Handles redirects from Pipeline SDK URLs to internal routes.
 *
 * Matches and redirects:
 * - Experiment URL: /external/pipelinesSdk/{namespace}/#/experiments/details/{experimentId}
 * - Run URL: /external/pipelinesSdk/{namespace}/#/runs/details/{runId}
 */
const PipelinesSdkRedirects: React.FC = () => {
  const { namespace } = useParams<{ namespace: string }>();
  const location = useLocation();

  const createRedirectPath = React.useCallback(() => {
    if (!namespace) {
      throw new Error('Missing namespace parameter');
    }

    // Extract experimentId from hash
    const experimentMatch = location.hash.match(/\/experiments\/details\/([^/]+)$/);
    if (experimentMatch) {
      const experimentId = experimentMatch[1];
      return experimentRunsRoute(namespace, experimentId);
    }

    // Extract runId from hash
    const runMatch = location.hash.match(/\/runs\/details\/([^/]+)$/);
    if (runMatch) {
      const runId = runMatch[1];
      return globalPipelineRunDetailsRoute(namespace, runId);
    }

    throw new Error('The URL format is invalid.');
  }, [namespace, location.hash]);

  const { error } = useRedirect(createRedirectPath);

  return (
    <ApplicationsPage
      loaded
      empty={false}
      loadError={error}
      loadErrorPage={
        <RedirectErrorState
          title="Error redirecting to pipelines"
          errorMessage={error?.message}
          actions={
            <>
              <Button
                variant="link"
                component={(props: React.ComponentProps<'a'>) => (
                  <Link {...props} to={pipelinesRootPath} />
                )}
              >
                Go to Pipeline definitions
              </Button>
              <Button
                variant="link"
                component={(props: React.ComponentProps<'a'>) => (
                  <Link {...props} to={experimentsRootPath} />
                )}
              >
                Go to Experiments
              </Button>
            </>
          }
        />
      }
    />
  );
};

export default PipelinesSdkRedirects;
