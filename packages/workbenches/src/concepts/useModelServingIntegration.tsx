import * as React from 'react';
import { useResolvedExtensions } from '@odh-dashboard/plugin-core';
import {
  isWorkbenchProjectsModelServingIntegrationExtension,
  type ModelServingContextProviderProps,
  type ProjectMetricsRoutesCompositeProps,
} from '@odh-dashboard/workbenches/extension-points/model-serving';

const useModelServingIntegration = () => {
  const [extensions, resolved] = useResolvedExtensions(
    isWorkbenchProjectsModelServingIntegrationExtension,
  );

  return React.useMemo(() => {
    if (!resolved || extensions.length === 0) {
      return { loaded: false as const };
    }
    const ext = extensions[0];
    return {
      loaded: true as const,
      ModelServingContextProvider: ext.properties.ModelServingContextProvider,
      DeployedModelsSectionComposite: ext.properties.DeployedModelsSectionComposite,
      ProjectMetricsRoutesComposite: ext.properties.ProjectMetricsRoutesComposite,
    };
  }, [extensions, resolved]);
};

export const ModelServingContextProviderWrapper: React.FC<ModelServingContextProviderProps> = ({
  children,
  namespace,
  getErrorComponent,
}) => {
  const integration = useModelServingIntegration();
  if (!integration.loaded) {
    return <>{children}</>;
  }
  const { ModelServingContextProvider } = integration;
  return (
    <ModelServingContextProvider namespace={namespace} getErrorComponent={getErrorComponent}>
      {children}
    </ModelServingContextProvider>
  );
};

export const DeployedModelsSectionCompositeWrapper: React.FC = () => {
  const integration = useModelServingIntegration();
  if (!integration.loaded) {
    return null;
  }
  const { DeployedModelsSectionComposite } = integration;
  return <DeployedModelsSectionComposite />;
};

export const ProjectMetricsRoutesCompositeWrapper: React.FC<ProjectMetricsRoutesCompositeProps> = (
  props,
) => {
  const integration = useModelServingIntegration();
  if (!integration.loaded) {
    return null;
  }
  const { ProjectMetricsRoutesComposite } = integration;
  return <ProjectMetricsRoutesComposite {...props} />;
};
