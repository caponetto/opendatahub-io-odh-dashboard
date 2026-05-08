import { SortableData } from '@odh-dashboard/dashboard-foundation-frontend/components/table';
import { ProjectKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { getProjectCreationTime } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/utils';
import { getDisplayNameFromK8sResource } from '@odh-dashboard/dashboard-foundation-frontend/concepts/k8s/utils';

export const columns: SortableData<ProjectKind>[] = [
  {
    field: 'name',
    label: 'Name',
    sortable: (a, b) =>
      getDisplayNameFromK8sResource(a).localeCompare(getDisplayNameFromK8sResource(b)),
    width: 40,
  },
  {
    field: 'created',
    label: 'Created',
    sortable: (a, b) => getProjectCreationTime(a) - getProjectCreationTime(b),
    width: 40,
  },
  {
    field: 'kebab',
    label: '',
    sortable: false,
    width: 20,
  },
];
