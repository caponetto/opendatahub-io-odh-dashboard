import * as React from 'react';
import { InferenceServiceKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { LastDeployed } from '@odh-dashboard/dashboard-foundation-frontend/components/LastDeployed.tsx';
import { getInferenceServiceStoppedStatus } from '../../utils';

type InferenceServiceLastDeployedProps = {
  inferenceService: InferenceServiceKind;
};

const InferenceServiceLastDeployed: React.FC<InferenceServiceLastDeployedProps> = ({
  inferenceService,
}) => {
  const { isStopped } = getInferenceServiceStoppedStatus(inferenceService);

  if (isStopped) {
    return <>-</>;
  }

  return <LastDeployed resource={inferenceService} />;
};

export default InferenceServiceLastDeployed;
