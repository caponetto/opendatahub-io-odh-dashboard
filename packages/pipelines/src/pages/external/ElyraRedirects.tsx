import React from 'react';
import { Link, useLocation, useParams, matchPath } from 'react-router-dom';
import { Button } from '@patternfly/react-core';
import ApplicationsPage from '@odh-dashboard/dashboard-foundation-frontend/components/ApplicationsPage';
import { useRedirect } from '@odh-dashboard/dashboard-foundation-frontend/utilities/useRedirect';
import RedirectErrorState from '@odh-dashboard/dashboard-foundation-frontend/pages/external/RedirectErrorState';
import { pipelinesRootPath } from '@odh-dashboard/pipelines-shared/concepts/pipelines/routes';
import { globalPipelineRunDetailsRoute } from '@odh-dashboard/pipelines/routes/runs';

/**
 * Handles redirects from Elyra URLs to internal routes.
 *
 * Matches and redirects:
 * - Run URL: /external/elyra/{namespace}/runs/{runId}
 */
const ElyraRedirects: React.FC = () => {
  const { namespace } = useParams<{ namespace: string }>();
  const location = useLocation();

  const createRedirectPath = React.useCallback(() => {
    if (!namespace) {
      throw new Error('Missing namespace parameter');
    }

    const match = matchPath('/external/elyra/:namespace/runs/:runId', location.pathname);
    const runId = match?.params.runId;
    if (runId) {
      return globalPipelineRunDetailsRoute(namespace, runId);
    }

    throw new Error('The URL format is invalid.');
  }, [namespace, location.pathname]);

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
            <Button
              variant="link"
              component={(props: React.ComponentProps<'a'>) => (
                <Link {...props} to={pipelinesRootPath} />
              )}
            >
              Go to Pipeline definitions
            </Button>
          }
        />
      }
    />
  );
};

export default ElyraRedirects;
