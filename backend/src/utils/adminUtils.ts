import { V1ResourceAttributes, V1SelfSubjectAccessReview } from '@kubernetes/client-node';
import {
  K8sStatus,
  KubeFastifyInstance,
  OauthFastifyRequest,
  PlatformType,
  ResourceAccessReviewResponse,
} from '../types';
import { getGroup } from './groupsUtils';
import { flatten, uniq } from 'lodash';
import { getNamespaces } from '../utils/notebookUtils';
import { getAuth } from './resourceUtils';
import { isK8sStatus } from './pass-through';
import { createSelfSubjectAccessReview } from './authUtils';

const SYSTEM_AUTHENTICATED = 'system:authenticated';
/** Usernames with invalid characters can start with `b64:` to keep their unwanted characters */
export const KUBE_SAFE_PREFIX = 'b64:';

/** @deprecated -- don't rely on groups (legacy usage only) */
const getGroupUserList = async (
  fastify: KubeFastifyInstance,
  groupListNames: string[],
  additionalUsers: string[] = [],
): Promise<string[]> => {
  const customObjectApi = fastify.kube.customObjectsApi;
  return Promise.all(groupListNames.map((group) => getGroup(customObjectApi, group))).then(
    (usersPerGroup: string[][]) => uniq([...flatten(usersPerGroup), ...additionalUsers]),
  );
};

/** @deprecated -- don't rely on groups (legacy usage only) */
export const getAdminUserList = async (fastify: KubeFastifyInstance): Promise<string[]> => {
  const auth = getAuth();
  if (!auth) {
    return [];
  }
  return getGroupUserList(fastify, auth.spec.adminGroups);
};

/** @deprecated -- don't rely on groups (legacy usage only) */
export const getClusterAdminUserList = async (fastify: KubeFastifyInstance): Promise<string[]> => {
  if (fastify.kube.platform !== PlatformType.OpenShift) {
    return [];
  }
  const { workbenchNamespace } = getNamespaces(fastify);
  const clusterAdminUsersAndGroups = await fastify.kube.customObjectsApi
    .createClusterCustomObject('authorization.openshift.io', 'v1', 'resourceaccessreviews', {
      resource: 'notebooks',
      resourceAPIGroup: 'kubeflow.org',
      resourceAPIVersion: 'v1',
      verb: '*',
      namespace: workbenchNamespace,
    })
    .then((rar) => rar.body as ResourceAccessReviewResponse)
    .catch((e) => {
      fastify.log.error(`Failure to fetch cluster admin users and groups: ${e.response.body}`);
      return { users: [], groups: [] };
    });
  const clusterAdminUsers = clusterAdminUsersAndGroups.users || [];
  const clusterAdminGroups = clusterAdminUsersAndGroups.groups || [];
  const filteredClusterAdminGroups = clusterAdminGroups.filter(
    (group) => !group.startsWith('system:'),
  );
  const filteredClusterAdminUsers = clusterAdminUsers.filter((user) => !user.startsWith('system:'));
  return getGroupUserList(fastify, filteredClusterAdminGroups, filteredClusterAdminUsers);
};

/** @deprecated -- don't rely on groups (legacy usage only) */
export const getAllowedUserList = async (fastify: KubeFastifyInstance): Promise<string[]> => {
  const auth = getAuth();
  if (!auth) {
    return [];
  }
  return getGroupUserList(
    fastify,
    auth.spec.allowedGroups.filter((groupName) => groupName && !groupName.startsWith('system:')),
  );
};

const SingletonAuthResource: V1ResourceAttributes = {
  group: 'services.platform.opendatahub.io',
  resource: 'auths',
  name: 'default-auth',
};

const handleSSARCheck = (v: V1SelfSubjectAccessReview | K8sStatus): boolean =>
  isK8sStatus(v) ? false : v.status.allowed;

export const isUserAdmin = async (
  fastify: KubeFastifyInstance,
  request: OauthFastifyRequest,
): Promise<boolean> => {
  if (fastify.kube.platform !== PlatformType.OpenShift) {
    const adminUsers = process.env.ADMIN_USERS?.split(',').map((u) => u.trim()) ?? [];
    if (adminUsers.length > 0) {
      const userName = String(
        request.headers['x-auth-request-user'] ??
          (request.headers['x-forwarded-access-token'] ? 'unknown' : ''),
      );
      return adminUsers.includes(userName);
    }
    return true;
  }

  return createSelfSubjectAccessReview(fastify, request, {
    ...SingletonAuthResource,
    verb: 'patch',
  })
    .then(handleSSARCheck)
    .catch(() => false);
};

export const isUserAllowed = async (
  fastify: KubeFastifyInstance,
  request: OauthFastifyRequest,
): Promise<boolean> => {
  if (fastify.kube.platform !== PlatformType.OpenShift) {
    return true;
  }

  const auth = getAuth();
  if (!auth) {
    return true;
  }
  if (auth.spec.allowedGroups.includes(SYSTEM_AUTHENTICATED)) {
    return true;
  }

  return createSelfSubjectAccessReview(fastify, request, {
    ...SingletonAuthResource,
    verb: 'get',
  })
    .then(handleSSARCheck)
    .catch(() => false);
};
