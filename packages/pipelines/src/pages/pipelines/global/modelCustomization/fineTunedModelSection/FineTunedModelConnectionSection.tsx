import React from 'react';
import { Alert, Radio, Skeleton, Stack, StackItem } from '@patternfly/react-core';
import { getResourceNameFromK8sResource } from '@odh-dashboard/dashboard-foundation-frontend/concepts/k8s/utils';
import {
  Connection,
  ConnectionTypeConfigMapObj,
} from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/types';
import { InferenceServiceStorageType } from '@odh-dashboard/dashboard-foundation-frontend/types';
import useConnections from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/useConnections';
import {
  isModelServingCompatible,
  ModelServingCompatibleTypes,
} from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/utils';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import { ConnectionFormData } from '@odh-dashboard/pipelines/concepts/content/modelCustomizationForm/modelCustomizationFormSchema/validationUtils';
import FineTunedModelExistingConnectionField from '@odh-dashboard/pipelines/pages/pipelines/global/modelCustomization/fineTunedModelSection/FineTunedModelExistingConnectionField';
import { FineTunedModelNewConnectionField } from '@odh-dashboard/pipelines/pages/pipelines/global/modelCustomization/fineTunedModelSection/FineTunedModelNewConnectionField';
import FineTunedModelOciPathField from '@odh-dashboard/pipelines/pages/pipelines/global/modelCustomization/fineTunedModelSection/FineTunedModelOciPathField';

type FineTunedModelConnectionSectionProps = {
  data: ConnectionFormData;
  setData: (connectionData: ConnectionFormData) => void;
  connectionTypes: ConnectionTypeConfigMapObj[];
};

const FineTunedModelConnectionSection: React.FC<FineTunedModelConnectionSectionProps> = ({
  data,
  setData,
  connectionTypes,
}) => {
  const { project } = usePipelinesAPI();
  const {
    data: fetchedConnections,
    loaded: connectionsLoaded,
    error: connectionsLoadError,
  } = useConnections(project.metadata.name);
  const ociConnections: Connection[] = React.useMemo(
    () =>
      fetchedConnections.filter((c) =>
        // For fine-tuned, we only fetch the connections that contain "Push" as the access type or don't contain any access type
        isModelServingCompatible(c, ModelServingCompatibleTypes.OCI, 'Push'),
      ),
    [fetchedConnections],
  );
  const [selectedConnection, setSelectedConnection] = React.useState<Connection>();

  if (connectionsLoadError) {
    return (
      <Alert title="Error loading connections" variant="danger">
        {connectionsLoadError.message}
      </Alert>
    );
  }

  return (
    <Stack hasGutter>
      <StackItem>
        <Radio
          name="existing-connection-radio"
          id="existing-connection-radio"
          data-testid="existing-connection-radio"
          label="Existing connection"
          isChecked={data.type === InferenceServiceStorageType.EXISTING_STORAGE}
          onChange={() => {
            setData({
              ...data,
              type: InferenceServiceStorageType.EXISTING_STORAGE,
            });
          }}
          body={
            data.type === InferenceServiceStorageType.EXISTING_STORAGE &&
            (!connectionsLoaded && project.metadata.name !== '' ? (
              <Skeleton />
            ) : (
              <>
                <FineTunedModelExistingConnectionField
                  connectionTypes={connectionTypes}
                  connections={ociConnections}
                  selectedConnection={selectedConnection}
                  onSelect={(selection) => {
                    setSelectedConnection(selection);
                    setData({
                      ...data,
                      connection: getResourceNameFromK8sResource(selection),
                    });
                  }}
                />
                {selectedConnection && (
                  <FineTunedModelOciPathField
                    modelUri={data.uri}
                    setModelUri={(uri) =>
                      setData({
                        ...data,
                        uri,
                      })
                    }
                    ociHost={window.atob(selectedConnection.data?.OCI_HOST ?? '')}
                  />
                )}
              </>
            ))
          }
        />
      </StackItem>
      <StackItem>
        <Radio
          name="new-connection-radio"
          id="new-connection-radio"
          data-testid="new-connection-radio"
          label="Create connection"
          className="pf-v6-u-mb-lg"
          isChecked={data.type === InferenceServiceStorageType.NEW_STORAGE}
          onChange={() => {
            setData({ ...data, type: InferenceServiceStorageType.NEW_STORAGE });
          }}
          body={
            data.type === InferenceServiceStorageType.NEW_STORAGE && (
              <>
                <FineTunedModelNewConnectionField connectionTypes={connectionTypes} />
                <FineTunedModelOciPathField
                  modelUri={data.uri}
                  setModelUri={(uri) =>
                    setData({
                      ...data,
                      uri,
                    })
                  }
                />
              </>
            )
          }
        />
      </StackItem>
    </Stack>
  );
};

export default FineTunedModelConnectionSection;
