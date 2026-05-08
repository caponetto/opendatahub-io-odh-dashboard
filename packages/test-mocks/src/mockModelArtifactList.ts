/* eslint-disable camelcase */
import { ModelArtifactList } from '@odh-dashboard/model-registry/concepts/modelRegistry/types';
import { mockModelArtifact } from './mockModelArtifact';

export const mockModelArtifactList = ({
  items = [mockModelArtifact()],
}: Partial<ModelArtifactList>): ModelArtifactList => ({
  items,
  nextPageToken: '',
  pageSize: 0,
  size: 1,
});
