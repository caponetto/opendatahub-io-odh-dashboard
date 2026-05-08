import * as React from 'react';
import {
  InferenceServiceKind,
  PersistentVolumeClaimKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { Connection } from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/types';
import { ProjectDetailsContext } from '@odh-dashboard/projects-shared/concepts/projects/ProjectDetailsContext';
import { getPVCNameFromURI } from '@odh-dashboard/model-serving-shared/concepts/modelServing/utils';

export const useInferenceServicesForConnection = (
  connection?: Connection | PersistentVolumeClaimKind,
): InferenceServiceKind[] => {
  const {
    inferenceServices: {
      data: { items: inferenceServices },
    },
  } = React.useContext(ProjectDetailsContext);
  const connectionName = connection?.metadata.name;
  if (!connection) {
    return [];
  }

  return inferenceServices.filter(
    (inferenceService) =>
      // Known issue: this only works for OCI, S3, and PVC connections
      inferenceService.spec.predictor.model?.storage?.key === connectionName ||
      inferenceService.spec.predictor.imagePullSecrets?.[0]?.name === connectionName ||
      getPVCNameFromURI(inferenceService.spec.predictor.model?.storageUri ?? '') ===
        connection.metadata.name,
  );
};
