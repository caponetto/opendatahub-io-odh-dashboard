import * as React from 'react';
import { InferenceServiceKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import KserveMetrics from './KserveMetrics';

type ModelGraphProps = {
  model: InferenceServiceKind;
};

// Always KServe
const ModelGraphs: React.FC<ModelGraphProps> = ({ model }) => (
  <KserveMetrics modelName={model.metadata.name} />
);

export default ModelGraphs;
