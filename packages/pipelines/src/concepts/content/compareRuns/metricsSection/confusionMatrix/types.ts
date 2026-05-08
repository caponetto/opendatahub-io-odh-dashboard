import { ConfusionMatrixConfig } from '@odh-dashboard/pipelines/concepts/content/artifacts/charts/confusionMatrix/types';

export type ConfusionMatrixConfigAndTitle = {
  title: string;
  config: ConfusionMatrixConfig;
};
