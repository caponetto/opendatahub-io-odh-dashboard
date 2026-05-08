import React from 'react';
import { Button } from '@patternfly/react-core';
import { OptimizeIcon } from '@patternfly/react-icons';
import { Connection } from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/types';
import { convertObjectStorageSecretData } from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/utils';
import { ConnectionModal } from '@odh-dashboard/model-registry/concepts/modelRegistry/content/ConnectionModal';
import {
  RegistrationCommonFormData,
  ModelLocationType,
} from '@odh-dashboard/model-registry/concepts/modelRegistry/types';

const AutofillConnectionButton: React.FC<{
  modelLocationType: ModelLocationType;
  setData: (
    propKey: keyof Pick<
      RegistrationCommonFormData,
      'modelLocationEndpoint' | 'modelLocationBucket' | 'modelLocationRegion' | 'modelLocationURI'
    >,
    propValue: string,
  ) => void;
}> = ({ modelLocationType, setData }) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const connectionDataMap: Record<
    string,
    keyof Pick<
      RegistrationCommonFormData,
      'modelLocationEndpoint' | 'modelLocationBucket' | 'modelLocationRegion'
    >
  > = {
    AWS_S3_ENDPOINT: 'modelLocationEndpoint',
    AWS_S3_BUCKET: 'modelLocationBucket',
    AWS_DEFAULT_REGION: 'modelLocationRegion',
  };

  const fillObjectStorageByConnection = (connection: Connection) => {
    convertObjectStorageSecretData(connection).forEach((dataItem) => {
      setData(connectionDataMap[dataItem.key], dataItem.value);
    });
    // TODO: Store the connection name
    // setData('storageKey', connection.metadata.name);
  };

  const fillURIByConnection = (connection: Connection) => {
    if (connection.data?.URI) {
      setData('modelLocationURI', window.atob(connection.data.URI));
      // TODO: Store the connection name
      // setData('storageKey', connection.metadata.name);
    }
  };

  return (
    <>
      <Button
        variant="link"
        data-testid={
          modelLocationType === ModelLocationType.ObjectStorage
            ? 'object-storage-autofill-button'
            : 'uri-autofill-button'
        }
        icon={<OptimizeIcon />}
        onClick={() => setIsModalOpen(true)}
      >
        Autofill connection
      </Button>
      {isModalOpen && (
        <ConnectionModal
          type={modelLocationType}
          onClose={() => setIsModalOpen(false)}
          onSubmit={(connection) => {
            if (modelLocationType === ModelLocationType.ObjectStorage) {
              fillObjectStorageByConnection(connection);
            } else {
              fillURIByConnection(connection);
            }
            setIsModalOpen(false);
          }}
        />
      )}
    </>
  );
};

export default AutofillConnectionButton;
