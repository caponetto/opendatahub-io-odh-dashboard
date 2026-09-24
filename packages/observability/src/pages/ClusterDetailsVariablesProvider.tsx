import * as React from 'react';
import { useVariableDefinitionActions } from '@perses-dev/dashboards';
import { useClusterInfo } from '@odh-dashboard/internal/redux/selectors/clusterInfo';
import { useWatchOperatorSubscriptionStatus } from '@odh-dashboard/internal/utilities/useWatchOperatorSubscriptionStatus';
import { CLUSTER_DETAILS_VARIABLES } from '../utils/variables';
import { useClusterDetails } from '../api/useClusterDetails';

export type ClusterDetailsVariables = {
  apiServer?: string;
  channel?: string;
  infrastructureProvider?: string;
  openshiftVersion?: string;
};

type ClusterDetailsVariablesProviderProps = {
  details: ClusterDetailsVariables;
  detailsLoaded?: boolean;
};

/**
 * ClusterDetailsVariablesProvider sets Perses dashboard variables for cluster information.
 * This component must be rendered as a child of PersesProvider to access the VariableProvider context.
 *
 * Sets all variables defined in CLUSTER_DETAILS_VARIABLES (from ../utils/variables):
 * - API_SERVER: The API server URL
 * - CHANNEL: The operator subscription channel
 * - OPENSHIFT_VERSION: The OpenShift version
 * - INFRASTRUCTURE_PROVIDER: The infrastructure platform type (AWS, GCP, Azure, etc.)
 */
export const ClusterDetailsVariablesProvider: React.FC<ClusterDetailsVariablesProviderProps> = ({
  details,
  detailsLoaded = true,
}) => {
  const { setVariableValue } = useVariableDefinitionActions();

  // Set all variables in a single effect when data is available
  React.useEffect(() => {
    // Set API server URL
    setVariableValue(CLUSTER_DETAILS_VARIABLES.API_SERVER, details.apiServer ?? 'Unknown');

    // Set channel from operator subscription status (same source as AboutDialog)
    setVariableValue(CLUSTER_DETAILS_VARIABLES.CHANNEL, details.channel ?? 'Unknown');

    // Set OpenShift version and infrastructure provider (only when loaded)
    if (detailsLoaded) {
      setVariableValue(
        CLUSTER_DETAILS_VARIABLES.OPENSHIFT_VERSION,
        details.openshiftVersion ?? 'Unknown',
      );
      setVariableValue(
        CLUSTER_DETAILS_VARIABLES.INFRASTRUCTURE_PROVIDER,
        details.infrastructureProvider ?? 'Unknown',
      );
    }
  }, [details, detailsLoaded, setVariableValue]);

  return null;
};

/**
 * TODO: Move this adapter to the frontend package once observability exposes a host-to-module adapter
 * contract. The frontend must provide this component to DashboardPage across the Module Federation
 * boundary so the package can remain host-neutral.
 */
const MainDashboardClusterDetailsVariablesProvider: React.FC = () => {
  // Get API server URL from redux state (same as AboutDialog)
  const { serverURL } = useClusterInfo();

  // Get operator subscription status for channel (same as AboutDialog)
  const [subStatus] = useWatchOperatorSubscriptionStatus();

  // Get OpenShift version and infrastructure provider
  const { data: clusterDetails, loaded: clusterDetailsLoaded } = useClusterDetails();

  const details = React.useMemo(
    () => ({
      apiServer: serverURL,
      channel: subStatus?.channel,
      openshiftVersion: clusterDetails.openshiftVersion,
      infrastructureProvider: clusterDetails.infrastructureProvider,
    }),
    [clusterDetails, serverURL, subStatus],
  );

  return <ClusterDetailsVariablesProvider details={details} detailsLoaded={clusterDetailsLoaded} />;
};

export default MainDashboardClusterDetailsVariablesProvider;
