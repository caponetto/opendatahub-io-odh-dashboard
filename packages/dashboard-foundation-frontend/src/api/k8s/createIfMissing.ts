import { K8sAPIOptions, RoleBindingKind, ServiceAccountKind, RoleKind } from '#~/k8sTypes';
import { getGenericErrorCode } from '#~/api/errorUtils';
import { createServiceAccount, getServiceAccount } from './serviceAccounts';
import { getRole, createRole } from './roles';
import { getRoleBinding, createRoleBinding } from './roleBindings';

const is404 = (e: unknown): boolean => getGenericErrorCode(e) === 404;

export const createServiceAccountIfMissing = async (
  serviceAccount: ServiceAccountKind,
  namespace: string,
  opts?: K8sAPIOptions,
): Promise<ServiceAccountKind> =>
  getServiceAccount(serviceAccount.metadata.name, namespace).catch((e: unknown) => {
    if (is404(e)) {
      return createServiceAccount(serviceAccount, opts);
    }
    return Promise.reject(e);
  });

export const createRoleIfMissing = async (
  role: RoleKind,
  namespace: string,
  opts?: K8sAPIOptions,
): Promise<RoleKind> =>
  getRole(namespace, role.metadata.name).catch((e: unknown) => {
    if (is404(e)) {
      return createRole(role, opts);
    }
    return Promise.reject(e);
  });

export const createRoleBindingIfMissing = async (
  rolebinding: RoleBindingKind,
  namespace: string,
  opts?: K8sAPIOptions,
): Promise<RoleBindingKind> =>
  getRoleBinding(namespace, rolebinding.metadata.name).catch((e: unknown) => {
    if (is404(e)) {
      return createRoleBinding(rolebinding, opts).catch((error: unknown) => {
        if (is404(error) && opts?.dryRun) {
          return Promise.resolve(rolebinding);
        }
        return Promise.reject(error);
      });
    }
    return Promise.reject(e);
  });
