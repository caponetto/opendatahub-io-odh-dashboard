import type { Extension, CodeRef } from '@odh-dashboard/plugin-core';
import type { FetchStateObject } from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetch';
import type {
  MlflowExperiment,
  MlflowSelectorStatus,
} from '@odh-dashboard/mlflow-shared/concepts/mlflow/types';

export type MlflowExperimentSelectorProps = {
  workspace: string;
  filter?: string;
  selection?: string;
  isDisabled?: boolean;
  onSelect: (experiment: MlflowExperiment) => void;
  onStatusChange?: (status: MlflowSelectorStatus) => void;
};

export type PipelinesMlflowIntegrationExtension = Extension<
  'pipelines.mlflow-integration',
  {
    useMlflowExperiments: CodeRef<
      (opts: { workspace: string; filter?: string }) => FetchStateObject<MlflowExperiment[]>
    >;
    MlflowExperimentSelector: CodeRef<React.ComponentType<MlflowExperimentSelectorProps>>;
    useIsMlflowCRAvailable: CodeRef<() => { available: boolean; loaded: boolean }>;
  }
>;

export const isPipelinesMlflowIntegrationExtension = (
  extension: Extension,
): extension is PipelinesMlflowIntegrationExtension =>
  extension.type === 'pipelines.mlflow-integration';
