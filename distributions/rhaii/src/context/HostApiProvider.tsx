import { NoopAnalyticsTrackingProvider } from '@odh-dashboard/analytics/react';
import React, { createContext, useContext, useMemo, type FC, type PropsWithChildren } from 'react';
import { k8sPatchResource } from '@openshift/dynamic-plugin-sdk-utils';
import {
  HostApiContext,
  HostApiCoreContext,
  HostApiInfraContext,
  type HostApiCoreServices,
  type HostApiInfraServices,
  type HostApiServices,
  type ClusterSettingsType,
} from '@odh-dashboard/plugin-core/host-api';
import {
  createSecret,
  deleteSecret,
  getSecret,
  getSecretsByLabel,
} from '@odh-dashboard/k8s-core/api/secrets';
import { SecretModel } from '@odh-dashboard/k8s-core/api/models';
import {
  KnownLabels,
  NamespaceApplicationCase,
  type K8sResourceCommon,
  type SecretKind,
} from '@odh-dashboard/k8s-core';
import {
  patchNamespaceMetadata,
  type NamespaceMetadataChange,
} from '@odh-dashboard/k8s-core/api/namespaces';
import { DashboardNamespaceContext } from './DashboardNamespaceContext';
import { checkAccess } from './checkAccess';
import { useServingConnections } from './useServingConnections';
import { useWatchConnectionTypes } from './useWatchConnectionTypes';
import UriConnectionFormFields from '../components/UriConnectionFormFields';

const ProjectDetailsContext = createContext(null);
const MODEL_SERVING_CONTEXT_VALUE = {
  inferenceServices: {
    data: { items: [] },
    loaded: true,
  },
};
const ModelServingContext = createContext(MODEL_SERVING_CONTEXT_VALUE);

const ModelServingContextProvider: HostApiServices['contexts']['ModelServingContextProvider'] = ({
  children,
}) => (
  <ModelServingContext.Provider value={MODEL_SERVING_CONTEXT_VALUE}>
    {children}
  </ModelServingContext.Provider>
);

const unsupportedCreateProject: HostApiServices['createProject'] = () =>
  Promise.reject(new Error('Project creation is not available in the RHAII host.'));

const patchSecretWithOwnerReference = (
  secret: SecretKind,
  resource: K8sResourceCommon & { metadata: { name: string } },
  uid: string,
): Promise<SecretKind> =>
  k8sPatchResource({
    model: SecretModel,
    queryOptions: { name: secret.metadata.name, ns: secret.metadata.namespace },
    patches: [
      ...(secret.metadata.resourceVersion
        ? [
            {
              op: 'test' as const,
              path: '/metadata/resourceVersion',
              value: secret.metadata.resourceVersion,
            },
          ]
        : []),
      {
        op: 'add',
        path: '/metadata/ownerReferences',
        value: [
          ...(secret.metadata.ownerReferences || []),
          {
            uid,
            name: resource.metadata.name,
            apiVersion: resource.apiVersion,
            kind: resource.kind,
            blockOwnerDeletion: false,
          },
        ],
      },
    ],
  });

const patchSecretWithProtocolAnnotation = (
  secret: SecretKind,
  protocol: string,
): Promise<SecretKind> =>
  k8sPatchResource({
    model: SecretModel,
    queryOptions: { name: secret.metadata.name, ns: secret.metadata.namespace },
    patches: [
      ...(secret.metadata.resourceVersion
        ? [
            {
              op: 'test' as const,
              path: '/metadata/resourceVersion',
              value: secret.metadata.resourceVersion,
            },
          ]
        : []),
      {
        op: 'add',
        path: '/metadata/annotations/opendatahub.io~1connection-type-protocol',
        value: protocol,
      },
    ],
  });

const createCoreApi = (dashboardNamespace: string): HostApiCoreServices => ({
  dashboardNamespace,
  checkAccess,
  fetchDashboardConfig: () =>
    Promise.reject(new Error('DashboardConfig is not available in the RHAII host.')),
  fetchClusterSettings: () =>
    Promise.resolve<ClusterSettingsType>({
      userTrackingEnabled: false,
      pvcSize: 0,
      cullerTimeout: 0,
      modelServingPlatformEnabled: { kServe: true, LLMd: true },
    }),
  updateClusterSettings: () =>
    Promise.reject(new Error('Cluster settings are not configurable in the RHAII host.')),
});

const infraApi: HostApiInfraServices = {
  createSecret,
  getSecret,
  deleteSecret,
  getSecretsByLabel,
  patchSecretWithOwnerReference,
  patchSecretWithProtocolAnnotation,
  createProject: () =>
    Promise.reject(new Error('Project creation is not available in the RHAII host.')),
  getDashboardPvcs: () => Promise.resolve([]),
};

const NIM_SUPPORT_ANNOTATION = 'opendatahub.io/nim-support';

// Only KServe promotion/reset in RHAII; NIM/ModelMesh are ODH-only.
const servingPlatformChanges: Partial<Record<NamespaceApplicationCase, NamespaceMetadataChange>> = {
  [NamespaceApplicationCase.KSERVE_PROMOTION]: {
    labels: { [KnownLabels.MODEL_SERVING_PROJECT]: 'false' },
  },
  [NamespaceApplicationCase.RESET_MODEL_SERVING_PLATFORM]: {
    labels: { [KnownLabels.MODEL_SERVING_PROJECT]: null },
    annotations: { [NIM_SUPPORT_ANNOTATION]: null },
  },
};

const setProjectServingPlatform: HostApiServices['setProjectServingPlatform'] = (
  name,
  servingPlatform,
  dryRun,
) => {
  const change = servingPlatformChanges[servingPlatform];
  if (!change) {
    return Promise.reject(
      new Error(
        `The ${NamespaceApplicationCase[servingPlatform]} platform case is not supported in the RHAII host.`,
      ),
    );
  }
  return patchNamespaceMetadata(name, change, { dryRun });
};

const hostApi: HostApiServices = {
  useTemplates: () => [[], true, undefined],
  setProjectServingPlatform,
  useWatchConnectionTypes,
  useServingConnections,
  getDashboardConfigTemplateOrder: () => Promise.resolve([]),
  getDashboardConfigTemplateDisablement: () => Promise.resolve([]),
  isProjectNIMSupported: () => false,
  createProject: unsupportedCreateProject,
  ConnectionTypeFormFields: UriConnectionFormFields,
  contexts: {
    ProjectDetailsContext,
    ModelServingContext,
    ModelServingContextProvider,
  },
};

/** Minimal xKS host services needed by the federated model-serving UI. */
// Tracking is intentionally disabled in RHAII until its Segment delivery integration is implemented.
// Consumers still need a mounted provider.
const HostApiProvider: FC<PropsWithChildren> = ({ children }) => {
  const dashboardNamespace = useContext(DashboardNamespaceContext);
  const coreApi = useMemo(() => createCoreApi(dashboardNamespace), [dashboardNamespace]);

  return (
    <NoopAnalyticsTrackingProvider>
      <HostApiCoreContext.Provider value={coreApi}>
        <HostApiInfraContext.Provider value={infraApi}>
          <HostApiContext.Provider value={hostApi}>{children}</HostApiContext.Provider>
        </HostApiInfraContext.Provider>
      </HostApiCoreContext.Provider>
    </NoopAnalyticsTrackingProvider>
  );
};

export default HostApiProvider;
