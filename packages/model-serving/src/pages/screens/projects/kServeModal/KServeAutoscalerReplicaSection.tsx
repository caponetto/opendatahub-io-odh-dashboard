import * as React from 'react';
import { UpdateObjectAtPropAndValue } from '@odh-dashboard/dashboard-foundation-frontend/types';
import ReplicaSection from '@odh-dashboard/dashboard-foundation-frontend/components/ReplicaSection';
import { CreatingInferenceServiceObject } from '../../types';

type KServeAutoscalerReplicaSectionProps = {
  data: CreatingInferenceServiceObject;
  setData: UpdateObjectAtPropAndValue<CreatingInferenceServiceObject>;
  infoContent?: string;
  onValidationChange?: (hasValidationErrors: boolean) => void;
};

const KServeAutoscalerReplicaSection: React.FC<KServeAutoscalerReplicaSectionProps> = ({
  data,
  setData,
  infoContent,
  onValidationChange,
}) => (
  <ReplicaSection
    infoContent={infoContent}
    isRequired
    onChange={(value) => {
      setData('minReplicas', value);
    }}
    value={data.minReplicas}
    maxValue={data.maxReplicas}
    onMaxChange={(value) => {
      setData('maxReplicas', value);
    }}
    onValidationChange={onValidationChange}
  />
);

export default KServeAutoscalerReplicaSection;
