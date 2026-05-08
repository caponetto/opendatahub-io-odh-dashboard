import {
  k8sCreateResource,
  k8sDeleteResource,
  k8sGetResource,
  K8sStatus,
} from '@odh-dashboard/k8s-browser';
import { kindApiVersion } from '@odh-dashboard/dashboard-foundation-frontend/concepts/k8s/utils';
import { K8sAPIOptions, TrustyAIKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { applyK8sAPIOptions } from '@odh-dashboard/dashboard-foundation-frontend/api/apiMergeUtils';
import { TrustyAIApplicationsModel } from '@odh-dashboard/dashboard-foundation-frontend/api/models/odh';
import { TRUSTYAI_DEFINITION_NAME } from '@odh-dashboard/trustyai/concepts/const';

export const getTrustyAICR = async (
  namespace: string,
  opts?: K8sAPIOptions,
): Promise<TrustyAIKind> =>
  k8sGetResource<TrustyAIKind>(
    applyK8sAPIOptions(
      {
        model: TrustyAIApplicationsModel,
        queryOptions: {
          ns: namespace,
          name: TRUSTYAI_DEFINITION_NAME,
        },
      },
      opts,
    ),
  );

export const createTrustyAICR = async (
  namespace: string,
  secretName: string,
  opts?: K8sAPIOptions,
): Promise<TrustyAIKind> => {
  const resource: TrustyAIKind = {
    apiVersion: kindApiVersion(TrustyAIApplicationsModel),
    kind: TrustyAIApplicationsModel.kind,
    metadata: {
      name: TRUSTYAI_DEFINITION_NAME,
      namespace,
    },
    spec: {
      storage: {
        format: 'DATABASE',
        databaseConfigurations: secretName,
      },
      metrics: {
        schedule: '5s',
      },
    },
  };

  return k8sCreateResource<TrustyAIKind>(
    applyK8sAPIOptions(
      {
        model: TrustyAIApplicationsModel,
        resource,
      },
      opts,
    ),
  );
};

export const deleteTrustyAICR = async (
  namespace: string,
  opts?: K8sAPIOptions,
): Promise<K8sStatus> =>
  k8sDeleteResource<TrustyAIKind, K8sStatus>(
    applyK8sAPIOptions(
      {
        model: TrustyAIApplicationsModel,
        queryOptions: {
          name: TRUSTYAI_DEFINITION_NAME,
          ns: namespace,
        },
      },
      opts,
    ),
  );
