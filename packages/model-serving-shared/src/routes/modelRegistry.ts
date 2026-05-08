export const modelRegistryRoute = (preferredModelRegistry = ''): string =>
  `/ai-hub/models/registry/${preferredModelRegistry}`;

export const modelRegistrySettingsRoute = (): string => '/modelRegistrySettings';

const registeredModelsRoute = (preferredModelRegistry?: string): string =>
  `${modelRegistryRoute(preferredModelRegistry)}/registered-models`;

export const registeredModelRoute = (rmId = '', preferredModelRegistry?: string): string =>
  `${registeredModelsRoute(preferredModelRegistry)}/${rmId}`;

export const registeredModelDeploymentsRoute = (
  rmId = '',
  preferredModelRegistry?: string,
): string => `${registeredModelRoute(rmId, preferredModelRegistry)}/deployments`;

const modelVersionListRoute = (rmId?: string, preferredModelRegistry?: string): string =>
  `${registeredModelRoute(rmId, preferredModelRegistry)}/versions`;

export const modelVersionRoute = (
  mvId: string,
  rmId?: string,
  preferredModelRegistry?: string,
): string => `${modelVersionListRoute(rmId, preferredModelRegistry)}/${mvId}`;

export const modelVersionDeploymentsRoute = (
  mvId: string,
  rmId?: string,
  preferredModelRegistry?: string,
): string => `${modelVersionRoute(mvId, rmId, preferredModelRegistry)}/deployments`;

export const modelCatalogRoute = `/ai-hub/models/catalog`;
