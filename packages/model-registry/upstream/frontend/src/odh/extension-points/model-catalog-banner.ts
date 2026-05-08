import type { Extension, CodeRef } from '@odh-dashboard/plugin-core';

export type ModelCatalogBannerExtension = Extension<
  'model-catalog.page/banner',
  {
    id: string;
    component: CodeRef<React.ComponentType>;
  }
>;

export const isModelCatalogBannerExtension = (
  extension: Extension,
): extension is ModelCatalogBannerExtension => extension.type === 'model-catalog.page/banner';
