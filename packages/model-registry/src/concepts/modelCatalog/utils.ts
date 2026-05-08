import { CatalogModel, CatalogModelDetailsParams } from './types';
import { RESERVED_ILAB_LABELS } from './const';

export const encodeParams = (params: CatalogModelDetailsParams): CatalogModelDetailsParams =>
  Object.fromEntries(
    Object.entries(params).map(([key, value]) => [
      key,
      encodeURIComponent(value).replace(/\./g, '%252E'),
    ]),
  );

export const getTagFromModel = (model: CatalogModel): string | undefined =>
  model.artifacts?.[0]?.tags?.[0];

export const getILabLabels = (labels?: string[]): string[] =>
  labels?.filter((l) => RESERVED_ILAB_LABELS.some((ril) => ril === l)) ?? [];

export const removeILabLabels = (labels?: string[]): string[] =>
  labels?.filter((l) => !RESERVED_ILAB_LABELS.some((ril) => ril === l)) ?? [];
