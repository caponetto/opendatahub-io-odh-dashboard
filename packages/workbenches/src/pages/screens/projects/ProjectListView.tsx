import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Table } from '@odh-dashboard/dashboard-foundation-frontend/components/table';
import { ProjectKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import {
  getProjectOwner,
  isAiProject,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/utils';
import { ProjectsContext } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/ProjectsContext';
import { getDisplayNameFromK8sResource } from '@odh-dashboard/dashboard-foundation-frontend/concepts/k8s/utils';
import DashboardEmptyTableView from '@odh-dashboard/dashboard-foundation-frontend/concepts/dashboard/DashboardEmptyTableView';
import { useBrowserStorage } from '@odh-dashboard/dashboard-foundation-frontend/components/browserStorage/BrowserStorageContext';
import ManageProjectModal from '@odh-dashboard/dashboard-foundation-frontend/components/ManageProjectModal';
import ProjectTableRow from '@odh-dashboard/workbenches/pages/screens/projects/ProjectTableRow';
import ProjectsToolbar from '@odh-dashboard/workbenches/pages/screens/projects/ProjectsToolbar';
import {
  aiProjectFilterKey,
  initialProjectsFilterData,
  ProjectsFilterDataType,
} from '@odh-dashboard/workbenches/pages/screens/projects/const';
import { columns } from './tableData';
import DeleteProjectModal from './DeleteProjectModal';

const PROJECT_FILTER_STORAGE_KEY = 'odh.dashboard.projects.type.filter';

type ProjectListViewProps = {
  allowCreate: boolean;
};

const getAiProjects = (projects: ProjectKind[]) => {
  return projects.filter((project) => {
    return isAiProject(project);
  });
};

const ProjectListView: React.FC<ProjectListViewProps> = ({ allowCreate }) => {
  const { projects } = React.useContext(ProjectsContext);
  const navigate = useNavigate();
  const [projectFilter, setProjectFilter] = useBrowserStorage<string>(
    PROJECT_FILTER_STORAGE_KEY,
    aiProjectFilterKey,
    true,
    true,
  );

  const [filterData, setFilterData] =
    React.useState<ProjectsFilterDataType>(initialProjectsFilterData);

  const aiProjectNum = getAiProjects(projects).length;
  const fullProjectNum = projects.length;

  const filteredProjects = React.useMemo(
    () =>
      projects.filter((project) => {
        const nameFilter = filterData.Name?.toLowerCase();
        const userFilter = filterData.User?.toLowerCase();
        const aiProjectFilter = projectFilter === aiProjectFilterKey;

        if (aiProjectFilter && !isAiProject(project)) {
          return false;
        }
        if (
          nameFilter &&
          !getDisplayNameFromK8sResource(project).toLowerCase().includes(nameFilter)
        ) {
          return false;
        }

        return !userFilter || getProjectOwner(project).toLowerCase().includes(userFilter);
      }),
    [projects, filterData, projectFilter],
  );

  const resetFilters = () => {
    setFilterData(initialProjectsFilterData);
  };

  const onFilterUpdate = React.useCallback(
    (key: string, value: string | { label: string; value: string } | undefined) =>
      setFilterData((prevValues) => ({ ...prevValues, [key]: value })),
    [setFilterData],
  );

  const [deleteData, setDeleteData] = React.useState<ProjectKind | undefined>();
  const [editData, setEditData] = React.useState<ProjectKind | undefined>();
  const [refreshIds, setRefreshIds] = React.useState<string[]>([]);

  return (
    <>
      <Table
        enablePagination
        loading={false}
        defaultSortColumn={0}
        data={filteredProjects}
        columns={columns}
        emptyTableView={<DashboardEmptyTableView onClearFilters={resetFilters} />}
        data-testid="project-view-table"
        rowRenderer={(project) => (
          <ProjectTableRow
            key={project.metadata.uid}
            obj={project}
            isRefreshing={refreshIds.includes(project.metadata.uid || '')}
            setEditData={(data) => setEditData(data)}
            setDeleteData={(data) => setDeleteData(data)}
            currentProjectFilterType={projectFilter}
          />
        )}
        onClearFilters={resetFilters}
        toolbarContent={
          <ProjectsToolbar
            setProjectFilter={setProjectFilter}
            projectFilter={projectFilter}
            allowCreate={allowCreate}
            filterData={filterData}
            onFilterUpdate={onFilterUpdate}
            aiProjectNum={aiProjectNum}
            fullProjectNum={fullProjectNum}
          />
        }
      />
      {!!editData && (
        <ManageProjectModal
          onClose={(newProjectName) => {
            if (newProjectName) {
              navigate(`/projects/${newProjectName}`);
              return;
            }

            const refreshId = editData.metadata.uid;
            if (refreshId) {
              setRefreshIds((otherIds) => [...otherIds, refreshId]);
            }

            setEditData(undefined);

            setRefreshIds((ids) => ids.filter((id) => id !== refreshId));
          }}
          editProjectData={editData}
        />
      )}
      {deleteData ? (
        <DeleteProjectModal
          deleteData={deleteData}
          onClose={() => {
            setDeleteData(undefined);
          }}
        />
      ) : null}
    </>
  );
};

export default ProjectListView;
