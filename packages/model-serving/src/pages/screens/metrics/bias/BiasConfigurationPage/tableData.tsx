import { BiasMetricConfig } from '@odh-dashboard/model-serving-shared/concepts/trustyai/types';
import { SortableData } from '@odh-dashboard/dashboard-foundation-frontend/components/table';

export const columns: SortableData<BiasMetricConfig>[] = [
  {
    field: 'expand',
    label: '',
    sortable: false,
  },
  {
    field: 'name',
    label: 'Name',
    sortable: (a, b) => a.name.localeCompare(b.name),
  },
  {
    field: 'metric',
    label: 'Metric',
    sortable: false,
  },
  {
    field: 'protected-attribute',
    label: 'Protected attribute',
    sortable: false,
  },
  {
    field: 'privileged-value',
    label: 'Privileged value',
    sortable: false,
  },
  {
    field: 'unprivileged-value',
    label: 'Unprivileged value',
    sortable: false,
  },
  {
    field: 'output',
    label: 'Output',
    sortable: false,
  },
  {
    field: 'output-value',
    label: 'Output value',
    sortable: false,
  },
  {
    field: 'kebab',
    label: '',
    sortable: false,
  },
];
