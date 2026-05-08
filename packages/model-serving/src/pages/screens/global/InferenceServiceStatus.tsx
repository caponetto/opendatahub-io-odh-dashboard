import * as React from 'react';
import { InferenceServiceKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { ToggleState } from '@odh-dashboard/dashboard-foundation-frontend/components/StateActionToggle';
import { useModelStatus } from './useModelStatus';
import {
  getInferenceServiceModelState,
  getInferenceServiceStatusMessage,
} from '../../../concepts/kserve/kserveStatusUtils';
import { ModelStatusIcon } from '../../../concepts/ModelStatusIcon';

type InferenceServiceStatusProps = {
  inferenceService: InferenceServiceKind;
  stoppedStates: ToggleState;
};

const InferenceServiceStatus: React.FC<InferenceServiceStatusProps> = ({
  inferenceService,
  stoppedStates,
}) => {
  const [modelPodStatus] = useModelStatus(
    inferenceService.metadata.namespace,
    inferenceService.spec.predictor.model?.runtime ?? '',
  );

  const state = getInferenceServiceModelState(inferenceService, modelPodStatus);
  const bodyContent = getInferenceServiceStatusMessage(inferenceService, modelPodStatus);

  return (
    <ModelStatusIcon
      state={state}
      defaultHeaderContent="Inference Service Status"
      bodyContent={bodyContent}
      stoppedStates={stoppedStates}
    />
  );
};

export default InferenceServiceStatus;
