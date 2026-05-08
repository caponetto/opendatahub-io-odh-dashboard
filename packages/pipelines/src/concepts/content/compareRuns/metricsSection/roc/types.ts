import { ROCCurveConfig } from '@odh-dashboard/pipelines/concepts/content/artifacts/charts/ROCCurve';
import { FullArtifactPath } from '@odh-dashboard/pipelines/concepts/content/compareRuns/metricsSection/types';

export type ConfidenceMetric = {
  confidenceThreshold: number;
  falsePositiveRate: number;
  recall: number;
};

export type FullArtifactPathsAndConfig = {
  fullArtifactPath: FullArtifactPath;
  config: ROCCurveConfig;
};
