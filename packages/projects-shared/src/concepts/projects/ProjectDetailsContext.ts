import * as React from 'react';
import type { Connection } from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/types';
import type { KueueWorkloadStatusWithMessage } from '@odh-dashboard/distributed-workloads-shared/concepts/kueue/types';
import type {
  GroupKind,
  HardwareProfileKind,
  InferenceServiceKind,
  LocalQueueKind,
  PersistentVolumeClaimKind,
  ProjectKind,
  RoleBindingKind,
  SecretKind,
  ServingRuntimeKind,
  TemplateKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import {
  DEFAULT_LIST_FETCH_STATE,
  DEFAULT_LIST_WATCH_RESULT,
  DEFAULT_LIST_WITH_NON_DASHBOARD_PRESENCE_FETCH_STATE,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import type {
  CustomWatchK8sResult,
  ListWithNonDashboardPresence,
} from '@odh-dashboard/dashboard-foundation-frontend/types';
import type { FetchStateObject } from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetch';
import type { NotebookState } from '@odh-dashboard/dashboard-foundation-frontend/concepts/notebook/notebookWorkbenchRuntimeTypes';

export type ProjectDetailsContextType = {
  currentProject: ProjectKind;
  filterTokens: (servingRuntime?: string) => SecretKind[];
  notebooks: FetchStateObject<NotebookState[]>;
  pvcs: FetchStateObject<PersistentVolumeClaimKind[]>;
  connections: FetchStateObject<Connection[]>;
  servingRuntimes: FetchStateObject<ListWithNonDashboardPresence<ServingRuntimeKind>>;
  servingRuntimeTemplates: CustomWatchK8sResult<TemplateKind[]>;
  servingRuntimeTemplateOrder: FetchStateObject<string[]>;
  servingRuntimeTemplateDisablement: FetchStateObject<string[]>;
  inferenceServices: FetchStateObject<ListWithNonDashboardPresence<InferenceServiceKind>>;
  serverSecrets: FetchStateObject<SecretKind[]>;
  projectSharingRB: FetchStateObject<RoleBindingKind[]>;
  groups: CustomWatchK8sResult<GroupKind[]>;
  projectHardwareProfiles: CustomWatchK8sResult<HardwareProfileKind[]>;
  localQueues: FetchStateObject<LocalQueueKind[]>;
  kueueStatusByNotebookName: Record<string, KueueWorkloadStatusWithMessage | null>;
  isKueueLoaded: boolean;
};

export const ProjectDetailsContext = React.createContext<ProjectDetailsContextType>({
  currentProject: { apiVersion: '', kind: '', metadata: { name: '' } },
  filterTokens: () => [],
  notebooks: DEFAULT_LIST_FETCH_STATE,
  pvcs: DEFAULT_LIST_FETCH_STATE,
  connections: DEFAULT_LIST_FETCH_STATE,
  servingRuntimes: DEFAULT_LIST_WITH_NON_DASHBOARD_PRESENCE_FETCH_STATE,
  servingRuntimeTemplates: DEFAULT_LIST_WATCH_RESULT,
  servingRuntimeTemplateOrder: DEFAULT_LIST_FETCH_STATE,
  servingRuntimeTemplateDisablement: DEFAULT_LIST_FETCH_STATE,
  inferenceServices: DEFAULT_LIST_WITH_NON_DASHBOARD_PRESENCE_FETCH_STATE,
  serverSecrets: DEFAULT_LIST_FETCH_STATE,
  projectSharingRB: DEFAULT_LIST_FETCH_STATE,
  groups: DEFAULT_LIST_WATCH_RESULT,
  projectHardwareProfiles: DEFAULT_LIST_WATCH_RESULT,
  localQueues: DEFAULT_LIST_FETCH_STATE,
  kueueStatusByNotebookName: {},
  isKueueLoaded: false,
});
