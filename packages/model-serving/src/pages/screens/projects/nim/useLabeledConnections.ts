import React from 'react';
import {
  Connection,
  LabeledConnection,
} from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/types';
import { convertObjectStorageSecretData } from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/utils';
import {
  ModelLocation,
  uriToModelLocation,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/modelRegistry/utils';
import { AccessTypes } from '@odh-dashboard/dashboard-foundation-frontend/constants/dataConnectionConst';
import { AwsKeys } from '@odh-dashboard/dashboard-foundation-frontend/constants/awsKeys';

const useLabeledConnections = (
  modelArtifactUri: string | undefined,
  connections: Connection[] = [],
): {
  connections: LabeledConnection[];
  modelLocation: ModelLocation;
} =>
  React.useMemo(() => {
    if (!modelArtifactUri) {
      return {
        connections: connections.map((connection) => ({ connection })),
        modelLocation: null,
      };
    }
    const modelLocation = uriToModelLocation(modelArtifactUri);
    if (!modelLocation) {
      return {
        connections: connections.map((connection) => ({ connection })),
        modelLocation,
      };
    }
    const labeledConnections = connections.map((connection) => {
      if (modelLocation.s3Fields) {
        const awsData = convertObjectStorageSecretData(connection);
        const bucket = awsData.find((data) => data.key === AwsKeys.AWS_S3_BUCKET)?.value;
        const endpoint = awsData.find((data) => data.key === AwsKeys.S3_ENDPOINT)?.value;
        const region = awsData.find((data) => data.key === AwsKeys.DEFAULT_REGION)?.value;
        if (
          bucket === modelLocation.s3Fields.bucket &&
          endpoint === modelLocation.s3Fields.endpoint &&
          (region === modelLocation.s3Fields.region || !modelLocation.s3Fields.region)
        ) {
          return { connection, isRecommended: true };
        }
      }
      if (modelLocation.ociUri && connection.data?.OCI_HOST) {
        const findURI = modelLocation.ociUri.includes(window.atob(connection.data.OCI_HOST));
        const accessTypes = connection.data.ACCESS_TYPE && window.atob(connection.data.ACCESS_TYPE);
        if (findURI && accessTypes && accessTypes.includes(AccessTypes.PULL)) {
          return { connection, isRecommended: true };
        }
      }
      if (modelLocation.uri && connection.data?.URI) {
        const findURI = modelLocation.uri === window.atob(connection.data.URI);
        if (findURI) {
          return { connection, isRecommended: true };
        }
      }
      return { connection };
    });
    return { connections: labeledConnections, modelLocation };
  }, [connections, modelArtifactUri]);

export default useLabeledConnections;
