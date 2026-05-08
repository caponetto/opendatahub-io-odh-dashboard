import * as React from 'react';
import { AxiosError } from 'axios';
import { K8sResourceCommon } from '@odh-dashboard/k8s-browser';
import useNamespaces from '@odh-dashboard/dashboard-foundation-frontend/utilities/useNamespaces';
import {
  createRoleBinding,
  getRoleBinding,
} from '@odh-dashboard/dashboard-foundation-frontend/services/roleBindingService';
import {
  NotebookKind,
  RoleBindingKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { useUser } from '@odh-dashboard/dashboard-foundation-frontend/redux/selectors';
import {
  EnvVarReducedTypeKeyValues,
  NotebookControllerUserState,
  Notebook,
  ResourceCreator,
  ResourceGetter,
  VariableRow,
} from '@odh-dashboard/dashboard-foundation-frontend/types';
import { useDeepCompareMemoize } from '@odh-dashboard/dashboard-foundation-frontend/utilities/useDeepCompareMemoize';
import { useGetNotebookRoute } from '@odh-dashboard/workbenches-shared/concepts/notebooks/useGetNotebookRoute';

import { usernameTranslate } from '@odh-dashboard/dashboard-foundation-frontend/utilities/notebookUtils';
import { EMPTY_USER_STATE } from '../pages/const';
import { NotebookControllerContext } from '../pages/NotebookControllerContext';

export const getNotebookDisplayName = (notebook: NotebookKind): string =>
  notebook.metadata.annotations?.['openshift.io/display-name'] || notebook.metadata.name || '';

export const generateEnvVarFileNameFromUsername = (username: string): string =>
  `jupyterhub-singleuser-profile-${usernameTranslate(username)}-envs`;

/**
 * Verify whether a resource is on the cluster
 * If it exists, return the resource object, else, return null
 * If the createFunc is also passed, create it when it doesn't exist
 */
export const verifyResource = async <T extends K8sResourceCommon>(
  name: string,
  namespace: string,
  fetchFunc: ResourceGetter<T>,
  createFunc?: ResourceCreator<T>,
  createBody?: T,
): Promise<T | undefined> =>
  fetchFunc(namespace, name).catch(async (e: AxiosError) => {
    if (e.response?.status === 404) {
      if (createFunc && createBody) {
        return createFunc(createBody);
      }
      return undefined;
    }
    throw e;
  });

/** Classify environment variables as ConfigMap or Secret */
export const classifyEnvVars = (variableRows: VariableRow[]): EnvVarReducedTypeKeyValues =>
  variableRows.reduce(
    (prev, curr) => {
      const vars: Record<string, string | number> = {};
      const secretVars: Record<string, string | number> = {};
      curr.variables.forEach((variable) => {
        if (variable.type === 'text') {
          vars[variable.name] = variable.value;
        } else {
          secretVars[variable.name] = variable.value;
        }
      });
      return {
        configMap: { ...prev.configMap, ...vars },
        secrets: { ...prev.secrets, ...secretVars },
      };
    },
    { configMap: {}, secrets: {} },
  );

export const getNotebookControllerUserState = (
  notebook: Notebook | null,
  loggedInUser: string,
): NotebookControllerUserState | null => {
  if (!notebook) {
    return null;
  }

  const annotations = notebook.metadata.annotations ?? {};

  const {
    'notebooks.kubeflow.org/last-activity': lastActivity,
    'notebooks.opendatahub.io/last-image-selection': lastSelectedImage = '',
    'notebooks.opendatahub.io/last-size-selection': lastSelectedSize = '',
    'opendatahub.io/username': annotationUser = '',
    'opendatahub.io/user': annotationTranslatedUser = '',
  } = annotations;

  let user = annotationUser;
  if (!annotationUser) {
    // Need to always have user -- if we don't, check if the current user is viable to translate to it
    // Check annotation first, then fall back to label for backward compatibility with older workbenches
    const translatedUser =
      annotationTranslatedUser || notebook.metadata.labels?.['opendatahub.io/user'];
    if (usernameTranslate(loggedInUser) === translatedUser) {
      user = loggedInUser;
    } else {
      /* eslint-disable-next-line no-console */
      console.error('Could not get full user data');
      return null;
    }
  }

  return {
    lastActivity: lastActivity ? new Date(lastActivity).getTime() : undefined,
    lastSelectedImage,
    lastSelectedSize,
    user,
  };
};

export const useSpecificNotebookUserState = (
  notebook: Notebook | null,
): NotebookControllerUserState => {
  const { impersonatedUsername } = React.useContext(NotebookControllerContext);
  const { username: stateUsername } = useUser();
  const username = impersonatedUsername || stateUsername;

  const userState = getNotebookControllerUserState(notebook, username);

  const state = userState ?? {
    ...EMPTY_USER_STATE,
    user: username,
  };

  return useDeepCompareMemoize(state);
};

export const useNotebookUserState = (): NotebookControllerUserState => {
  const { currentUserNotebook } = React.useContext(NotebookControllerContext);
  return useSpecificNotebookUserState(currentUserNotebook);
};

/** Check whether the namespace of the notebooks has the access to image streams
 * If not, create the rolebinding
 */
export const validateNotebookNamespaceRoleBinding = async (
  notebookNamespace: string,
  dashboardNamespace: string,
): Promise<RoleBindingKind | undefined> => {
  const roleBindingName = `${notebookNamespace}-image-pullers`;
  const roleBindingObject: RoleBindingKind = {
    apiVersion: 'rbac.authorization.k8s.io/v1',
    kind: 'RoleBinding',
    metadata: {
      name: roleBindingName,
      namespace: dashboardNamespace,
    },
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'ClusterRole',
      name: 'system:image-puller',
    },
    subjects: [
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'Group',
        name: `system:serviceaccounts:${notebookNamespace}`,
      },
    ],
  };
  return verifyResource<RoleBindingKind>(
    roleBindingName,
    dashboardNamespace,
    getRoleBinding,
    createRoleBinding,
    roleBindingObject,
  );
};

export const useNotebookRedirectLink = (): (() => Promise<string>) => {
  const { currentUserNotebook, currentUserNotebookLink } =
    React.useContext(NotebookControllerContext);
  const { workbenchNamespace } = useNamespaces();

  const routeName = currentUserNotebook?.metadata.name;

  const workbenchPath =
    useGetNotebookRoute(
      workbenchNamespace,
      routeName,
      currentUserNotebook?.metadata.annotations?.['notebooks.opendatahub.io/inject-auth'] ===
        'true',
      true,
    ) ?? '';

  return React.useCallback((): Promise<string> => {
    if (!routeName) {
      // At time of call, if we do not have a route name, we are too late
      // This should *never* happen, somehow the modal got here before the Notebook had a name!?
      /* eslint-disable-next-line no-console */
      console.error('Unable to determine why there was no route -- notebook did not have a name');
      return Promise.reject();
    }

    return new Promise<string>((resolve) => {
      // Use the existing link if available, otherwise generate the path
      if (currentUserNotebookLink) {
        resolve(currentUserNotebookLink);
      } else {
        // Generate same-origin relative path
        resolve(workbenchPath);
      }
    });
  }, [routeName, currentUserNotebookLink, workbenchPath]);
};
