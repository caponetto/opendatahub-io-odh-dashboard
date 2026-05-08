import { SortableData } from '@odh-dashboard/dashboard-foundation-frontend/components/table';
import { NotebookState } from '@odh-dashboard/dashboard-foundation-frontend/concepts/notebook/notebookWorkbenchRuntimeTypes';
import { getDisplayNameFromK8sResource } from '@odh-dashboard/dashboard-foundation-frontend/concepts/k8s/utils';
import { getNotebookStatusPriority } from '@odh-dashboard/workbenches/pages/utils';

export const columns: SortableData<NotebookState>[] = [
  {
    field: 'expand',
    label: '',
    sortable: false,
  },
  {
    field: 'name',
    label: 'Name',
    width: 25,
    sortable: (a, b) =>
      getDisplayNameFromK8sResource(a.notebook).localeCompare(
        getDisplayNameFromK8sResource(b.notebook),
      ),
  },
  {
    field: 'image',
    label: 'Workbench image',
    width: 20,
    sortable: false,
  },
  {
    field: 'hardwareProfile',
    label: 'Hardware profile',
    width: 15,
    sortable: false,
  },
  {
    field: 'status',
    label: 'Status',
    sortable: (a, b) => getNotebookStatusPriority(a) - getNotebookStatusPriority(b),
    width: 20,
  },
  {
    field: 'toggle-status',
    label: '',
    sortable: false,
  },
  {
    field: 'kebab',
    label: '',
    sortable: false,
  },
];
