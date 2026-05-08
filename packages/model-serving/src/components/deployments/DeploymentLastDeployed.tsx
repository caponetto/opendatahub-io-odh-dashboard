import React from 'react';
import { LastDeployed } from '@odh-dashboard/dashboard-foundation-frontend/components/LastDeployed';
import { Deployment } from '@odh-dashboard/model-serving-shared/extension-points';

type DeploymentLastDeployedProps = {
  deployment: Deployment;
};

const DeploymentLastDeployed: React.FC<DeploymentLastDeployedProps> = ({
  deployment: { model },
}) => <LastDeployed resource={model} />;

export default DeploymentLastDeployed;
