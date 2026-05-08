export const pipelinesRootPath = '/develop-train/pipelines/definitions';

export const pipelinesBaseRoute = (namespace?: string): string =>
  !namespace ? pipelinesRootPath : `${pipelinesRootPath}/${namespace}`;
