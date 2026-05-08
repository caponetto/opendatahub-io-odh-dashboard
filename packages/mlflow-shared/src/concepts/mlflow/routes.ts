export const mlflowRootPath = '/develop-train/mlflow';
export const mlflowExperimentsPath = `${mlflowRootPath}/experiments`;

export const WORKSPACE_QUERY_PARAM = 'workspace';

const withWorkspace = (basePath: string, namespace?: string): string => {
  if (!namespace) {
    return basePath;
  }
  return `${basePath}?${WORKSPACE_QUERY_PARAM}=${encodeURIComponent(namespace)}`;
};

export const mlflowExperimentsBaseRoute = (namespace?: string): string =>
  withWorkspace(mlflowExperimentsPath, namespace);

export const mlflowExperimentRoute = (experimentId: string, namespace?: string): string =>
  withWorkspace(`${mlflowExperimentsPath}/${encodeURIComponent(experimentId)}`, namespace);
