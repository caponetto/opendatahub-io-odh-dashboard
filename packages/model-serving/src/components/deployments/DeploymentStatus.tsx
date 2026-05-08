import React from 'react';
import { ToggleState } from '@odh-dashboard/dashboard-foundation-frontend/components/StateActionToggle';
import { ModelDeploymentState } from '@odh-dashboard/model-serving-shared/concepts/modelServing/deploymentState';
import { Deployment } from '@odh-dashboard/model-serving-shared/extension-points';
import { DeploymentEndpointsPopupButton } from './DeploymentEndpointsPopupButton';

type DeploymentStatusProps = {
  deployment: Deployment;
  stoppedStates?: ToggleState;
};

const DeploymentStatus: React.FC<DeploymentStatusProps> = ({ deployment, stoppedStates }) => {
  if (stoppedStates?.isStarting) {
    return 'Pending';
  }

  if (
    deployment.status?.state === ModelDeploymentState.FAILED_TO_LOAD ||
    stoppedStates?.isStopped ||
    stoppedStates?.isStopping
  ) {
    return 'Not available';
  }

  return (
    <DeploymentEndpointsPopupButton
      endpoints={deployment.endpoints}
      loading={stoppedStates?.isStarting ?? false}
      apiProtocol={deployment.apiProtocol}
    />
  );
};

export default DeploymentStatus;
