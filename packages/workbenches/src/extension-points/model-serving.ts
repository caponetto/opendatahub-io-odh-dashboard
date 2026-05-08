import type { CodeRef, Extension } from '@odh-dashboard/plugin-core';

export type ModelServingContextProviderProps = {
  children: React.ReactNode;
  namespace: string;
  getErrorComponent?: (message?: string) => React.ReactElement;
};

export type DeployedModelsSectionCompositeProps = Record<string, never>;

export type ProjectMetricsRoutesCompositeProps = {
  modelMetricsEnabled: boolean;
  biasMetricsAreaAvailable: boolean;
};

export type WorkbenchProjectsModelServingIntegrationExtension = Extension<
  'workbench.model-serving-integration',
  {
    ModelServingContextProvider: CodeRef<React.ComponentType<ModelServingContextProviderProps>>;
    DeployedModelsSectionComposite: CodeRef<
      React.ComponentType<DeployedModelsSectionCompositeProps>
    >;
    ProjectMetricsRoutesComposite: CodeRef<React.ComponentType<ProjectMetricsRoutesCompositeProps>>;
  }
>;

export const isWorkbenchProjectsModelServingIntegrationExtension = (
  extension: Extension,
): extension is WorkbenchProjectsModelServingIntegrationExtension =>
  extension.type === 'workbench.model-serving-integration';
