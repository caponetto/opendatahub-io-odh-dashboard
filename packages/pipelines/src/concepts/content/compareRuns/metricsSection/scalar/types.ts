import { SortableData } from '@odh-dashboard/dashboard-foundation-frontend/components/table';

export type XParentLabel = {
  label: string;
  colSpan: number;
};

export type ScalarRowData = {
  row: string[];
  dataCount: number;
};

export type ScalarTableData = { key: string; values: string[] };

export type ScalarTableProps = {
  columns: SortableData<ScalarTableData>[];
  subColumns: SortableData<ScalarTableData>[];
  data: ScalarTableData[];
};
