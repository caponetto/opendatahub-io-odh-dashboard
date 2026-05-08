import { IdentifierResourceType } from '@odh-dashboard/dashboard-foundation-frontend/types';
import {
  HardwareProfileFormData,
  ManageHardwareProfileSectionID,
  ManageHardwareProfileSectionTitlesType,
} from './manage/types';

export const ManageHardwareProfileSectionTitles: ManageHardwareProfileSectionTitlesType = {
  [ManageHardwareProfileSectionID.DETAILS]: 'Details',
  [ManageHardwareProfileSectionID.VISIBILITY]: 'Visibility',
  [ManageHardwareProfileSectionID.IDENTIFIERS]: 'Resource requests and limits',
  [ManageHardwareProfileSectionID.SCHEDULING]: 'Resource allocation',
  [ManageHardwareProfileSectionID.ALLOCATION_STRATEGY]: 'Workload allocation strategy',
  [ManageHardwareProfileSectionID.LOCAL_QUEUE]: 'Local queue',
  [ManageHardwareProfileSectionID.WORKLOAD_PRIORITY]: 'Workload priority',
  [ManageHardwareProfileSectionID.NODE_SELECTORS]: 'Node selectors',
  [ManageHardwareProfileSectionID.TOLERATIONS]: 'Tolerations',
};

export const DEFAULT_HARDWARE_PROFILE_FORM_DATA: HardwareProfileFormData = {
  name: '',
  displayName: '',
  description: '',
  visibility: [],
  enabled: true,
  identifiers: [
    {
      identifier: 'cpu',
      displayName: 'CPU',
      defaultCount: 2,
      maxCount: 4,
      minCount: 1,
      resourceType: IdentifierResourceType.CPU,
    },
    {
      identifier: 'memory',
      displayName: 'Memory',
      defaultCount: '4Gi',
      minCount: '2Gi',
      maxCount: '8Gi',
      resourceType: IdentifierResourceType.MEMORY,
    },
  ],
};

export const CPU_MEMORY_MISSING_WARNING =
  'It is not recommended to remove the last CPU or Memory resource. Resources that use this hardware profile will schedule, but will be very unstable due to not having any lower or upper resource bounds.';
