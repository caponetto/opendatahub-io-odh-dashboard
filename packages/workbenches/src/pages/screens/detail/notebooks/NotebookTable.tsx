import * as React from 'react';
import { Table } from '@odh-dashboard/dashboard-foundation-frontend/components/table';
import { NotebookKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { NotebookState } from '@odh-dashboard/dashboard-foundation-frontend/concepts/notebook/notebookWorkbenchRuntimeTypes';
import { ProjectDetailsContext } from '@odh-dashboard/projects-shared/concepts/projects/ProjectDetailsContext';
import DeleteNotebookModal from '@odh-dashboard/workbenches/pages/notebook/DeleteNotebookModal';
import {
  CanEnableElyraPipelinesCheckWrapper as CanEnableElyraPipelinesCheck,
  ElyraInvalidVersionAlertsWrapper,
} from '@odh-dashboard/workbenches/concepts/usePipelinesIntegration';
import NotebookTableRow from './NotebookTableRow';
import { columns } from './data';

type NotebookTableProps = {
  notebookStates: NotebookState[];
  refresh: () => void;
};

const NotebookTable: React.FC<NotebookTableProps> = ({ notebookStates, refresh }) => {
  const { currentProject } = React.useContext(ProjectDetailsContext);
  const [notebookToDelete, setNotebookToDelete] = React.useState<NotebookKind | undefined>();

  return (
    <>
      <ElyraInvalidVersionAlertsWrapper notebooks={notebookStates.map((n) => n.notebook)}>
        {(showImpactedNotebookInfo) => (
          <CanEnableElyraPipelinesCheck namespace={currentProject.metadata.name}>
            {(canEnablePipelines) => (
              <Table
                data-testid="notebook-table"
                variant="compact"
                data={notebookStates}
                columns={columns}
                disableRowRenderSupport
                rowRenderer={(notebookState, i) => (
                  <NotebookTableRow
                    key={notebookState.notebook.metadata.uid}
                    rowIndex={i}
                    obj={notebookState}
                    onNotebookDelete={setNotebookToDelete}
                    canEnablePipelines={canEnablePipelines}
                    showOutOfDateElyraInfo={showImpactedNotebookInfo(notebookState.notebook)}
                  />
                )}
              />
            )}
          </CanEnableElyraPipelinesCheck>
        )}
      </ElyraInvalidVersionAlertsWrapper>
      {notebookToDelete ? (
        <DeleteNotebookModal
          notebook={notebookToDelete}
          onClose={(deleted) => {
            if (deleted) {
              refresh();
            }
            setNotebookToDelete(undefined);
          }}
        />
      ) : null}
    </>
  );
};

export default NotebookTable;
