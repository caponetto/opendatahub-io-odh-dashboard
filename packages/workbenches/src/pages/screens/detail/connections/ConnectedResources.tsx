import * as React from 'react';
import { LabelGroup, Spinner } from '@patternfly/react-core';
import { Connection } from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/types';
import { ProjectObjectType } from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/utils';
import { getDisplayNameFromK8sResource } from '@odh-dashboard/dashboard-foundation-frontend/concepts/k8s/utils';
import { PersistentVolumeClaimKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { EitherNotBoth } from '@odh-dashboard/dashboard-foundation-frontend/typeHelpers';
import { useInferenceServicesForConnection } from '@odh-dashboard/workbenches/pages/useInferenceServicesForConnection';
import ResourceLabel from '@odh-dashboard/workbenches/pages/screens/detail/connections/ResourceLabel';
import {
  useRelatedNotebooks,
  ConnectedNotebookContext,
} from '@odh-dashboard/workbenches/pages/notebook/useRelatedNotebooks';

export type ConnectedResourcesProps = EitherNotBoth<
  { connection: Connection },
  { pvc: PersistentVolumeClaimKind }
>;

const ConnectedResources: React.FC<ConnectedResourcesProps> = ({ connection, pvc }) => {
  const { notebooks: connectedNotebooks, loaded: notebooksLoaded } = useRelatedNotebooks(
    connection
      ? ConnectedNotebookContext.EXISTING_DATA_CONNECTION
      : ConnectedNotebookContext.EXISTING_PVC,
    connection ? connection.metadata.name : pvc.metadata.name,
  );
  const connectedModels = useInferenceServicesForConnection(connection ?? pvc);

  if (!notebooksLoaded) {
    return <Spinner size="sm" />;
  }

  if (!connectedNotebooks.length && !connectedModels.length) {
    return '--';
  }

  const renderNotebookLabels = () =>
    connectedNotebooks.map((notebook) => (
      <ResourceLabel
        key={notebook.metadata.name}
        resourceType={ProjectObjectType.build}
        title={getDisplayNameFromK8sResource(notebook)}
        outlineColor="teal"
      />
    ));

  const renderModelLabels = () =>
    connectedModels.map((model) => (
      <ResourceLabel
        key={model.metadata.name}
        resourceType={ProjectObjectType.connectedModels}
        title={getDisplayNameFromK8sResource(model)}
        outlineColor="purple"
      />
    ));

  return (
    <LabelGroup>
      {renderNotebookLabels()}
      {renderModelLabels()}
    </LabelGroup>
  );
};

export default ConnectedResources;
