import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Table } from '@odh-dashboard/dashboard-foundation-frontend/components/table';
import {
  InferenceServiceKind,
  ServingRuntimeKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { ProjectDetailsContext } from '@odh-dashboard/projects-shared/concepts/projects/ProjectDetailsContext';
import { fireFormTrackingEvent } from '@odh-dashboard/dashboard-foundation-frontend/concepts/analyticsTracking/segmentIOUtils';
import { TrackingOutcome } from '@odh-dashboard/dashboard-foundation-frontend/concepts/analyticsTracking/trackingProperties';
import {
  byName,
  ProjectsContext,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/ProjectsContext';
import KServeInferenceServiceTableRow from './KServeInferenceServiceTableRow';
import DeleteInferenceServiceModal from '../../global/DeleteInferenceServiceModal';
import ManageKServeModal from '../kServeModal/ManageKServeModal';
import { getKServeInferenceServiceColumns } from '../../global/data';
import { isProjectNIMSupported } from '../nim/nimUtils';
import ManageNIMServingModal from '../nim/NIMServiceModal/ManageNIMServingModal';

const KServeInferenceServiceTable: React.FC = () => {
  const { projects } = React.useContext(ProjectsContext);
  const { namespace } = useParams<{ namespace: string }>();
  const project = projects.find(byName(namespace));
  const isKServeNIMEnabled = !!project && isProjectNIMSupported(project);
  const [editKserveResources, setEditKServeResources] = React.useState<
    | {
        inferenceService: InferenceServiceKind;
        servingRuntime?: ServingRuntimeKind;
      }
    | undefined
  >(undefined);
  const [deleteKserveResources, setDeleteKServeResources] = React.useState<
    | {
        inferenceService: InferenceServiceKind;
        servingRuntime?: ServingRuntimeKind;
      }
    | undefined
  >(undefined);

  const {
    servingRuntimes: { refresh: refreshServingRuntime },
    connections: { refresh: refreshConnections },
    inferenceServices: {
      data: { items: inferenceServices },
      refresh: refreshInferenceServices,
    },
    serverSecrets: { refresh: refreshServerSecrets },
    filterTokens,
  } = React.useContext(ProjectDetailsContext);
  const columns = getKServeInferenceServiceColumns();

  const KServeManageModalComponent = isKServeNIMEnabled ? ManageNIMServingModal : ManageKServeModal;

  return (
    <>
      <Table
        data={inferenceServices}
        data-testid="deployments-table"
        columns={columns}
        disableRowRenderSupport
        defaultSortColumn={1}
        rowRenderer={(modelServer, rowIndex) => (
          <KServeInferenceServiceTableRow
            project={project?.metadata.name}
            key={modelServer.metadata.uid}
            obj={modelServer}
            columnNames={columns.map((column) => column.field)}
            onEditKServe={(obj) => setEditKServeResources(obj)}
            onDeleteKServe={(obj) => setDeleteKServeResources(obj)}
            rowIndex={rowIndex}
          />
        )}
      />
      {deleteKserveResources ? (
        <DeleteInferenceServiceModal
          inferenceService={deleteKserveResources.inferenceService}
          servingRuntime={deleteKserveResources.servingRuntime}
          onClose={(deleted) => {
            fireFormTrackingEvent('Model Deleted', {
              outcome: deleted ? TrackingOutcome.submit : TrackingOutcome.cancel,
              type: 'single',
            });
            if (deleted) {
              refreshServingRuntime();
              refreshInferenceServices();
            }
            setDeleteKServeResources(undefined);
          }}
        />
      ) : null}
      {editKserveResources ? (
        <KServeManageModalComponent
          editInfo={{
            servingRuntimeEditInfo: {
              servingRuntime: editKserveResources.servingRuntime,
              secrets: [],
            },
            inferenceServiceEditInfo: editKserveResources.inferenceService,
            secrets: filterTokens(
              editKserveResources.inferenceService.spec.predictor.model?.runtime,
            ),
          }}
          onClose={(submit: boolean) => {
            setEditKServeResources(undefined);
            if (submit) {
              refreshServingRuntime();
              refreshInferenceServices();
              refreshConnections();
              refreshServerSecrets();
            }
          }}
        />
      ) : null}
    </>
  );
};

export default KServeInferenceServiceTable;
