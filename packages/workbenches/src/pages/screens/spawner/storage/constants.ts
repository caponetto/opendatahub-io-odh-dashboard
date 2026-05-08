import {
  SortableData,
  kebabTableColumn,
} from '@odh-dashboard/dashboard-foundation-frontend/components/table';
import { StorageData } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/workbenchStorageTypes';
import { AccessMode } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { getAccessModePopover } from './getAccessModePopover';
import { MOUNT_PATH_PREFIX } from './const';

export const clusterStorageTableColumns: SortableData<StorageData>[] = [
  {
    label: 'ID',
    field: 'id',
    sortable: false,
    visibility: ['hidden'],
  },
  {
    label: 'Name',
    field: 'name',
    sortable: false,
  },
  {
    label: 'Access mode',
    field: 'accessMode',
    sortable: false,
    width: 30,
    info: {
      popover: getAccessModePopover({}),
      popoverProps: {
        showClose: true,
        maxWidth: '500px',
      },
    },
  },
  {
    label: 'Storage size',
    field: 'size',
    sortable: false,
  },
  {
    label: 'Mount path',
    field: 'mountPath',
    sortable: false,
  },
  kebabTableColumn(),
];

export const defaultClusterStorage = {
  name: 'storage',
  description: '',
  mountPath: MOUNT_PATH_PREFIX,
  accessMode: AccessMode.RWO,
};
