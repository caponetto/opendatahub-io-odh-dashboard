/* eslint-disable camelcase */
import { ModelVersionList } from '@odh-dashboard/model-registry/concepts/modelRegistry/types';

export const mockModelVersionList = ({
  items = [],
}: Partial<ModelVersionList>): ModelVersionList => ({
  items,
  nextPageToken: '',
  pageSize: 0,
  size: items.length,
});
