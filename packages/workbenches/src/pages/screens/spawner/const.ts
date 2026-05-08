import { BuildPhase } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { SpawnerPageSectionID, SpawnerPageSectionTitlesType } from './types';

export const SpawnerPageSectionTitles: SpawnerPageSectionTitlesType = {
  [SpawnerPageSectionID.NAME_DESCRIPTION]: 'Name and description',
  [SpawnerPageSectionID.WORKBENCH_IMAGE]: 'Workbench image',
  [SpawnerPageSectionID.DEPLOYMENT_SIZE]: 'Deployment size',
  [SpawnerPageSectionID.ENVIRONMENT_VARIABLES]: 'Environment variables',
  [SpawnerPageSectionID.CLUSTER_STORAGE]: 'Cluster storage',
  [SpawnerPageSectionID.CONNECTIONS]: 'Connections',
  [SpawnerPageSectionID.FEATURE_STORE]: 'Feature stores',
};

export const ScrollableSelectorID = 'workbench-spawner-page';

export const FAILED_PHASES = [BuildPhase.ERROR, BuildPhase.FAILED];
export const PENDING_PHASES = [BuildPhase.NEW, BuildPhase.PENDING, BuildPhase.CANCELLED];

export const DEFAULT_NOTEBOOK_SIZES = [
  {
    name: 'Small',
    resources: {
      requests: {
        cpu: '1',
        memory: '8Gi',
      },
      limits: {
        cpu: '2',
        memory: '8Gi',
      },
    },
  },
  {
    name: 'Medium',
    resources: {
      requests: {
        cpu: '3',
        memory: '24Gi',
      },
      limits: {
        cpu: '6',
        memory: '24Gi',
      },
    },
  },
  {
    name: 'Large',
    resources: {
      requests: {
        cpu: '7',
        memory: '56Gi',
      },
      limits: {
        cpu: '14',
        memory: '56Gi',
      },
    },
  },
  {
    name: 'X Large',
    resources: {
      requests: {
        cpu: '15',
        memory: '120Gi',
      },
      limits: {
        cpu: '30',
        memory: '120Gi',
      },
    },
  },
];
