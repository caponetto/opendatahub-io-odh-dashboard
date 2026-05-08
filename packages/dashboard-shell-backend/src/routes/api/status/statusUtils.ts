import { FastifyRequest } from 'fastify';
import {
  KubeFastifyInstance,
  KubeStatus,
} from '@odh-dashboard/dashboard-foundation-backend/backendTypes';
import { getUserInfo } from '@odh-dashboard/dashboard-foundation-backend/userUtils';
import { createCustomError } from '@odh-dashboard/dashboard-foundation-backend/requestUtils';
import { isUserAdmin, isUserAllowed } from '@odh-dashboard/dashboard-foundation-backend/adminUtils';
import { isImpersonating } from '@odh-dashboard/dashboard-foundation-backend/devFlags';
import { getSegmentUserId } from '@odh-dashboard/dashboard-foundation-backend/segmentUtils';

export const status = async (
  fastify: KubeFastifyInstance,
  request: FastifyRequest,
): Promise<{ kube: KubeStatus }> => {
  const kubeContext = fastify.kube.currentContext;
  const { config, currentContext, namespace, currentUser, clusterID, clusterBranding } =
    fastify.kube;
  const currentCluster = config.getCurrentCluster();
  if (currentCluster === null) {
    throw new Error('The current cluster cannot be null');
  }

  const { server } = currentCluster;

  const { userName, userID: devSandboxUserId } = await getUserInfo(fastify, request);
  const isAdmin = await isUserAdmin(fastify, request);
  const isAllowed = isAdmin ? true : await isUserAllowed(fastify, request);

  // Get segment user ID with fallbacks
  const userID = devSandboxUserId || (await getSegmentUserId(fastify, request, userName));

  if (!kubeContext && !kubeContext.trim()) {
    const error = createCustomError(
      'failed to get kube status',
      'Unable to determine current login stats. Please make sure you are logged into OpenShift.',
    );
    fastify.log.error(error, 'failed to get status');
    throw error;
  } else {
    const impersonating = isImpersonating();
    const data: KubeStatus = {
      currentContext,
      currentUser,
      namespace,
      userName,
      userID,
      clusterID,
      clusterBranding,
      isAdmin,
      isAllowed,
      serverURL: server,
    };
    if (impersonating) {
      data.isImpersonating = impersonating;
    }
    return {
      kube: data,
    };
  }
};
