import { FetchState } from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import {
  useSelectorSearch,
  UseSelectorSearchValue,
} from '@odh-dashboard/pipelines/concepts/content/pipelineSelector/utils';
import usePipelineVersionsTable from '@odh-dashboard/pipelines/concepts/content/tables/pipelineVersion/usePipelineVersionsTable';
import {
  LoadMoreProps,
  usePipelineVersionLoadMore,
} from '@odh-dashboard/pipelines/concepts/content/tables/usePipelineLoadMore';
import {
  TableProps,
  TableSortProps,
  getTableSortProps,
} from '@odh-dashboard/pipelines/concepts/content/tables/usePipelineTable';
import {
  PipelineCoreResourceKF,
  PipelineVersionKF,
} from '@odh-dashboard/pipelines/concepts/kfTypes';
import { PipelineListPaged } from '@odh-dashboard/pipelines/concepts/types';

type UseLoadMoreFunc<T> = [T[], () => Promise<void>];
type UsePipelineSelectorData<DataType> = {
  loaded: boolean;
  initialLoaded: boolean;
  data: DataType[];
  sortProps: TableSortProps;
  onLoadMore: UseLoadMoreFunc<DataType>[1];
  onSearchClear: UseSelectorSearchValue['onClear'];
  fetchedSize: number;
  searchProps: Omit<UseSelectorSearchValue, 'onClear' | 'totalSize'>;
} & Pick<UseSelectorSearchValue, 'totalSize'>;

const usePipelineVersionSelector = (
  pipelineId: string | undefined,
): UsePipelineSelectorData<PipelineVersionKF> => {
  const versionsTable = usePipelineVersionsTable(pipelineId)();
  const [[{ items: initialData, nextPageToken: initialPageToken }, loaded]] = versionsTable;
  return useCreateUsePipelineSelector<PipelineVersionKF>(
    versionsTable,
    usePipelineVersionLoadMore({ initialData, initialPageToken, loaded }, pipelineId),
  );
};

const useCreateUsePipelineSelector = <T extends PipelineCoreResourceKF>(
  tableData: [FetchState<PipelineListPaged<T>>, TableProps],
  useLoadMoreFunc: (props: LoadMoreProps) => UseLoadMoreFunc<T>,
): UsePipelineSelectorData<T> => {
  const [[{ totalSize: fetchedSize }, loaded], { initialLoaded, ...tableProps }] = tableData;
  const sortProps = getTableSortProps(tableProps);
  const { sortDirection, sortField, setFilter, filter } = tableProps;
  const [data, onLoadMore] = useLoadMoreFunc({
    sortDirection,
    sortField,
    filter,
  });
  const {
    totalSize,
    onClear: onSearchClear,
    ...searchProps
  } = useSelectorSearch({ setFilter, fetchedSize, loaded });

  return {
    loaded,
    initialLoaded,
    data,
    sortProps,
    onLoadMore,
    onSearchClear,
    totalSize,
    fetchedSize,
    searchProps,
  };
};

export default usePipelineVersionSelector;
