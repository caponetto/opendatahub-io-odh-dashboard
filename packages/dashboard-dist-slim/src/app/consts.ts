export const SLIM_MODEL_SERVING_ROUTE = '/model-serving';
export const SLIM_PROJECT_METRICS_ROUTE = '/projects/:namespace/metrics';
export const SLIM_PROJECT_METRICS_ROUTE_PATH = `${SLIM_PROJECT_METRICS_ROUTE}/*`;

export const getSlimProjectMetricsRoute = (namespace: string): string =>
  `/projects/${namespace}/metrics`;
