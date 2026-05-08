import * as React from 'react';
import { Button, Popover } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import EmptyDetailsView from '@odh-dashboard/dashboard-foundation-frontend/components/EmptyDetailsView';
import { ProjectSectionID } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/projectSectionId';
import { ProjectSectionTitles } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/projectSectionTitles';
import { ProjectDetailsContext } from '@odh-dashboard/projects-shared/concepts/projects/ProjectDetailsContext';
import DetailsSection from '@odh-dashboard/dashboard-foundation-frontend/components/DetailsSection';
import DashboardPopupIconButton from '@odh-dashboard/dashboard-foundation-frontend/concepts/dashboard/DashboardPopupIconButton';
import {
  ProjectObjectType,
  typedEmptyImage,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/utils';
import StorageTable from './StorageTable';
import ClusterStorageModal from './ClusterStorageModal';

const StorageList: React.FC = () => {
  const [isOpen, setOpen] = React.useState(false);
  const {
    notebooks: { refresh: refreshNotebooks },
    pvcs: { data: pvcs, loaded: pvcsLoaded, error: pvcsError, refresh: refreshPvcs },
  } = React.useContext(ProjectDetailsContext);
  const isPvcsEmpty = pvcs.length === 0;

  const refresh = () => {
    refreshPvcs();
    refreshNotebooks();
  };

  return (
    <>
      <DetailsSection
        id={ProjectSectionID.CLUSTER_STORAGES}
        objectType={ProjectObjectType.clusterStorage}
        title={ProjectSectionTitles[ProjectSectionID.CLUSTER_STORAGES] || ''}
        popover={
          <Popover
            headerContent="About cluster storage"
            bodyContent="Cluster storage saves your project’s data on a selected cluster. You can optionally connect cluster storage to a workbench. "
          >
            <DashboardPopupIconButton
              icon={<OutlinedQuestionCircleIcon />}
              aria-label="More info"
            />
          </Popover>
        }
        actions={[
          <Button
            onClick={() => setOpen(true)}
            key={`action-${ProjectSectionID.CLUSTER_STORAGES}`}
            variant="primary"
            data-testid="actions-cluster-storage-button"
          >
            Add cluster storage
          </Button>,
        ]}
        isLoading={!pvcsLoaded}
        isEmpty={isPvcsEmpty}
        loadError={pvcsError}
        emptyState={
          <EmptyDetailsView
            title="Start by adding cluster storage"
            description="Cluster storage saves your project’s data on a selected cluster. You can optionally connect cluster storage to a workbench."
            iconImage={typedEmptyImage(ProjectObjectType.clusterStorage)}
            imageAlt="add cluster storage"
            createButton={
              <Button
                data-testid="cluster-storage-button"
                onClick={() => setOpen(true)}
                variant="primary"
              >
                Add cluster storage
              </Button>
            }
          />
        }
      >
        {!isPvcsEmpty ? (
          <StorageTable pvcs={pvcs} refresh={refresh} onAddPVC={() => setOpen(true)} />
        ) : null}
      </DetailsSection>
      {isOpen ? (
        <ClusterStorageModal
          onClose={(submitted) => {
            setOpen(false);
            if (submitted) {
              refresh();
            }
          }}
        />
      ) : null}
    </>
  );
};

export default StorageList;
