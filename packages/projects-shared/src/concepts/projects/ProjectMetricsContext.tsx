import * as React from 'react';
import type {
  InferenceServiceKind,
  ProjectKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import type { ListWithNonDashboardPresence } from '@odh-dashboard/dashboard-foundation-frontend/types';
import type { FetchStateObject } from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetch';

export type ProjectMetricsContextType = {
  project: ProjectKind;
  namespace: string;
  inferenceServices: FetchStateObject<ListWithNonDashboardPresence<InferenceServiceKind>>;
};

const ProjectMetricsContext = React.createContext<ProjectMetricsContextType | null>(null);

type ProjectMetricsContextProviderProps = React.PropsWithChildren<ProjectMetricsContextType>;

export const ProjectMetricsContextProvider: React.FC<ProjectMetricsContextProviderProps> = ({
  children,
  project,
  namespace,
  inferenceServices,
}) => {
  const value = React.useMemo<ProjectMetricsContextType>(
    () => ({
      project,
      namespace,
      inferenceServices,
    }),
    [inferenceServices, namespace, project],
  );

  return <ProjectMetricsContext.Provider value={value}>{children}</ProjectMetricsContext.Provider>;
};

export const useProjectMetricsContext = (): ProjectMetricsContextType => {
  const ctx = React.useContext(ProjectMetricsContext);
  if (!ctx) {
    throw new Error('useProjectMetricsContext must be used within a ProjectMetricsContextProvider');
  }

  return ctx;
};

export default ProjectMetricsContext;
