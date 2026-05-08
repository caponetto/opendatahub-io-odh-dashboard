import type { CodeRef, Extension } from '@odh-dashboard/plugin-core';
import type { NotebookKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';

export type PipelinesContextProviderProps = {
  children: React.ReactNode;
  namespace: string;
};

export type CanEnableElyraPipelinesCheckProps = {
  children: (canEnablePipelines: boolean) => React.ReactNode;
  namespace: string;
};

export type PipelinesSectionProps = Record<string, never>;

export type PipelinesOverviewCardProps = Record<string, never>;

export type ElyraInvalidVersionAlertsProps = {
  notebooks: NotebookKind[];
  children: (showImpactedNotebookInfo: (notebook: NotebookKind) => boolean) => React.ReactNode;
};

export type WorkbenchProjectsPipelinesIntegrationExtension = Extension<
  'workbench.pipelines-integration',
  {
    PipelineContextProvider: CodeRef<React.ComponentType<PipelinesContextProviderProps>>;
    PipelinesSection: CodeRef<React.ComponentType<PipelinesSectionProps>>;
    PipelinesOverviewCard: CodeRef<React.ComponentType<PipelinesOverviewCardProps>>;
    CanEnableElyraPipelinesCheck: CodeRef<React.ComponentType<CanEnableElyraPipelinesCheckProps>>;
    ElyraInvalidVersionAlerts: CodeRef<React.ComponentType<ElyraInvalidVersionAlertsProps>>;
  }
>;

export const isWorkbenchProjectsPipelinesIntegrationExtension = (
  extension: Extension,
): extension is WorkbenchProjectsPipelinesIntegrationExtension =>
  extension.type === 'workbench.pipelines-integration';
