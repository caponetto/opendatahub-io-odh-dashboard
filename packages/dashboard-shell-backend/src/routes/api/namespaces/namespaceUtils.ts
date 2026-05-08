import { PatchUtils, V1SelfSubjectAccessReview } from '@kubernetes/client-node';
import {
  K8sStatus,
  KnownLabels,
  KubeFastifyInstance,
  OauthFastifyRequest,
} from '@odh-dashboard/dashboard-foundation-backend/backendTypes';
import { createCustomError } from '@odh-dashboard/dashboard-foundation-backend/requestUtils';
import { isK8sStatus } from '@odh-dashboard/dashboard-foundation-backend/pass-through';
import { getDashboardConfig } from '@odh-dashboard/dashboard-foundation-backend/resourceUtils';
import { createSelfSubjectAccessReview } from '@odh-dashboard/dashboard-foundation-backend/authUtils';
import { NamespaceApplicationCase } from './const';

const checkAdminNamespacePermission = (
  fastify: KubeFastifyInstance,
  request: OauthFastifyRequest,
  name: string,
): Promise<V1SelfSubjectAccessReview | K8sStatus> =>
  createSelfSubjectAccessReview(fastify, request, {
    group: 'project.openshift.io',
    resource: 'projects',
    subresource: '',
    verb: 'update',
    name,
    namespace: name,
  });

const checkEditNamespacePermission = (
  fastify: KubeFastifyInstance,
  request: OauthFastifyRequest,
  name: string,
): Promise<V1SelfSubjectAccessReview | K8sStatus> =>
  createSelfSubjectAccessReview(fastify, request, {
    group: 'serving.kserve.io',
    resource: 'servingruntimes',
    subresource: '',
    verb: 'create',
    name,
    namespace: name,
  });

export const applyNamespaceChange = async (
  fastify: KubeFastifyInstance,
  request: OauthFastifyRequest,
  name: string,
  context: NamespaceApplicationCase,
  dryRun?: string,
): Promise<{ applied: boolean }> => {
  if (name.startsWith('openshift') || name.startsWith('kube')) {
    // Kubernetes and OpenShift namespaces are off limits to this flow
    throw createCustomError(
      'Invalid namespace target',
      'Cannot mutate namespaces with "openshift" or "kube"',
      400,
    );
  }

  let annotations: Record<string, string | null> = {};
  let labels: Record<string, string | null> = {};
  let checkPermissionsFn: (
    fastify: KubeFastifyInstance,
    request: OauthFastifyRequest,
    name: string,
  ) => Promise<V1SelfSubjectAccessReview | K8sStatus>;
  const config = getDashboardConfig(request);
  const isKueueDisabled = config.spec.dashboardConfig.disableKueue;
  switch (context) {
    case NamespaceApplicationCase.DSG_CREATION:
      labels = {
        [KnownLabels.DASHBOARD_RESOURCE]: 'true',
        ...(!isKueueDisabled && { [KnownLabels.KUEUE_MANAGED]: 'true' }),
      };
      checkPermissionsFn = checkAdminNamespacePermission;
      break;
    case NamespaceApplicationCase.KSERVE_PROMOTION:
      labels = { 'modelmesh-enabled': 'false' };
      checkPermissionsFn = checkEditNamespacePermission;
      break;
    case NamespaceApplicationCase.KSERVE_NIM_PROMOTION:
      annotations = { 'opendatahub.io/nim-support': 'true' };
      checkPermissionsFn = checkEditNamespacePermission;
      break;
    case NamespaceApplicationCase.RESET_MODEL_SERVING_PLATFORM:
      annotations = { 'opendatahub.io/nim-support': null };
      labels = { 'modelmesh-enabled': null };
      checkPermissionsFn = checkEditNamespacePermission;
      break;
    default:
      throw createCustomError('Unknown configuration', 'Cannot apply namespace change', 400);
  }

  const selfSubjectAccessReview = await checkPermissionsFn(fastify, request, name);
  if (isK8sStatus(selfSubjectAccessReview)) {
    throw createCustomError(
      selfSubjectAccessReview.reason,
      selfSubjectAccessReview.message,
      selfSubjectAccessReview.code,
    );
  }
  if (!selfSubjectAccessReview.status?.allowed) {
    fastify.log.error(
      `Unable to access the namespace, ${selfSubjectAccessReview.status?.reason ?? ''}`,
    );
    throw createCustomError(
      'Forbidden',
      "You don't have permission to update serving platform labels on the current project.",
      403,
    );
  }

  return fastify.kube.coreV1Api
    .patchNamespace(
      name,
      { metadata: { annotations, labels } },
      undefined,
      dryRun,
      undefined,
      undefined,
      {
        headers: { 'Content-type': PatchUtils.PATCH_FORMAT_JSON_MERGE_PATCH },
      },
    )
    .then(() => ({ applied: true }))
    .catch((e) => {
      fastify.log.error(
        `Unable to update Namespace "${name}" with context "${
          NamespaceApplicationCase[context]
        }". ${e.response?.body?.message || e.message}`,
      );
      return { applied: false };
    });
};
