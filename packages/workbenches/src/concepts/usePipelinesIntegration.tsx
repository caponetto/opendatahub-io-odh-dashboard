import * as React from 'react';
import { useResolvedExtensions } from '@odh-dashboard/plugin-core';
import {
  isWorkbenchProjectsPipelinesIntegrationExtension,
  type CanEnableElyraPipelinesCheckProps,
  type ElyraInvalidVersionAlertsProps,
  type PipelinesContextProviderProps,
} from '@odh-dashboard/workbenches/extension-points';

const usePipelinesIntegration = () => {
  const [extensions, resolved] = useResolvedExtensions(
    isWorkbenchProjectsPipelinesIntegrationExtension,
  );

  return React.useMemo(() => {
    if (!resolved || extensions.length === 0) {
      return { loaded: false as const };
    }
    const ext = extensions[0];
    return {
      loaded: true as const,
      PipelineContextProvider: ext.properties.PipelineContextProvider,
      PipelinesSection: ext.properties.PipelinesSection,
      PipelinesOverviewCard: ext.properties.PipelinesOverviewCard,
      CanEnableElyraPipelinesCheck: ext.properties.CanEnableElyraPipelinesCheck,
      ElyraInvalidVersionAlerts: ext.properties.ElyraInvalidVersionAlerts,
    };
  }, [extensions, resolved]);
};

export const PipelineContextProviderWrapper: React.FC<PipelinesContextProviderProps> = ({
  children,
  namespace,
}) => {
  const integration = usePipelinesIntegration();
  if (!integration.loaded) {
    return <>{children}</>;
  }
  const { PipelineContextProvider } = integration;
  return <PipelineContextProvider namespace={namespace}>{children}</PipelineContextProvider>;
};

export const CanEnableElyraPipelinesCheckWrapper: React.FC<CanEnableElyraPipelinesCheckProps> = ({
  children,
  namespace,
}) => {
  const integration = usePipelinesIntegration();
  if (!integration.loaded) {
    return <>{children(false)}</>;
  }
  const { CanEnableElyraPipelinesCheck } = integration;
  return (
    <CanEnableElyraPipelinesCheck namespace={namespace}>{children}</CanEnableElyraPipelinesCheck>
  );
};

export const PipelinesSectionWrapper: React.FC = () => {
  const integration = usePipelinesIntegration();
  if (!integration.loaded) {
    return null;
  }
  const { PipelinesSection } = integration;
  return <PipelinesSection />;
};

export const PipelinesOverviewCardWrapper: React.FC = () => {
  const integration = usePipelinesIntegration();
  if (!integration.loaded) {
    return null;
  }
  const { PipelinesOverviewCard } = integration;
  return <PipelinesOverviewCard />;
};

export const ElyraInvalidVersionAlertsWrapper: React.FC<ElyraInvalidVersionAlertsProps> = ({
  notebooks,
  children,
}) => {
  const integration = usePipelinesIntegration();
  if (!integration.loaded) {
    const noOp = () => false;
    return <>{children(noOp)}</>;
  }
  const { ElyraInvalidVersionAlerts } = integration;
  return <ElyraInvalidVersionAlerts notebooks={notebooks}>{children}</ElyraInvalidVersionAlerts>;
};
