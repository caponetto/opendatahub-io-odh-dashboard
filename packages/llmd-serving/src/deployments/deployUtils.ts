import { K8sStatus } from '@odh-dashboard/k8s-browser';
import {
  assembleSecretSA,
  createSecret,
  deleteSecret,
  replaceSecret,
} from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/secrets';
import { assembleServiceAccount } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/serviceAccounts';
import { generateRoleBindingServiceAccount } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/roleBindings';
import { addOwnerReference } from '@odh-dashboard/dashboard-foundation-frontend/api/k8sUtils';
import {
  SecretKind,
  K8sAPIOptions,
  RoleKind,
  KnownLabels,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { getTokenNames } from '@odh-dashboard/model-serving-shared/concepts/modelServing/utils';
import {
  createServiceAccountIfMissing,
  createRoleIfMissing,
  createRoleBindingIfMissing,
} from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/createIfMissing';
import { LLMInferenceServiceKind } from '../types';

export const generateRoleLLMInferenceService = (
  roleName: string,
  llmInferenceServiceName: string,
  namespace: string,
): RoleKind => {
  const role: RoleKind = {
    apiVersion: 'rbac.authorization.k8s.io/v1',
    kind: 'Role',
    metadata: {
      name: roleName,
      namespace,
      labels: {
        [KnownLabels.DASHBOARD_RESOURCE]: 'true',
      },
    },
    rules: [
      {
        verbs: ['get'],
        apiGroups: ['serving.kserve.io'],
        resources: ['llminferenceservices'],
        resourceNames: [llmInferenceServiceName],
      },
    ],
  };
  return role;
};

export const createSecrets = async (
  tokenAuth: { displayName: string; k8sName?: string; uuid: string; error?: string }[] | undefined,
  deployedModelName: string,
  namespace: string,
  owner: LLMInferenceServiceKind,
  existingSecrets?: SecretKind[],
  opts?: K8sAPIOptions,
): Promise<void> => {
  const { serviceAccountName } = getTokenNames(deployedModelName, namespace);
  const deletedSecrets =
    existingSecrets
      ?.map((secret) => secret.metadata.name)
      .filter((token: string) => !tokenAuth?.some((tokenEdit) => tokenEdit.k8sName === token)) ||
    [];
  const tokensToProcess = tokenAuth || [];

  await Promise.all<K8sStatus | SecretKind>([
    ...tokensToProcess.map((token) => {
      const secretToken = addOwnerReference(
        assembleSecretSA(token.displayName, serviceAccountName, namespace, token.k8sName),
        owner,
      );
      if (token.k8sName) {
        return replaceSecret(secretToken, opts);
      }
      return createSecret(secretToken, opts);
    }),
    ...deletedSecrets.map((secret) => deleteSecret(namespace, secret, opts)),
  ]);
};

export const setUpTokenAuth = async (
  tokenAuth: { displayName: string; k8sName?: string; uuid: string; error?: string }[] | undefined,
  deployedModelName: string,
  namespace: string,
  createTokenAuth: boolean,
  owner: LLMInferenceServiceKind,
  existingSecrets?: SecretKind[],
  opts?: K8sAPIOptions,
): Promise<void> => {
  const { serviceAccountName, roleName, roleBindingName } = getTokenNames(
    deployedModelName,
    namespace,
  );

  const serviceAccount = addOwnerReference(
    assembleServiceAccount(serviceAccountName, namespace),
    owner,
  );

  const role = addOwnerReference(
    generateRoleLLMInferenceService(roleName, deployedModelName, namespace),
    owner,
  );

  const roleBinding = addOwnerReference(
    generateRoleBindingServiceAccount(
      roleBindingName,
      serviceAccountName,
      {
        kind: 'Role',
        name: roleName,
      },
      namespace,
    ),
    owner,
  );

  return (
    createTokenAuth
      ? Promise.all([
          createServiceAccountIfMissing(serviceAccount, namespace, opts),
          createRoleIfMissing(role, namespace, opts),
        ]).then(() => createRoleBindingIfMissing(roleBinding, namespace, opts))
      : Promise.resolve()
  )
    .then(() =>
      createSecrets(tokenAuth, deployedModelName, namespace, owner, existingSecrets, opts),
    )
    .catch((error) => Promise.reject(error));
};
