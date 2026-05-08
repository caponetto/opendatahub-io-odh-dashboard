import * as _ from 'lodash-es';
import {
  k8sDeleteResource,
  k8sGetResource,
  k8sListResource,
  K8sStatus,
} from '@odh-dashboard/k8s-browser';
import type {
  InferenceServiceKind,
  K8sAPIOptions,
  PodKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { getModelServingProjects } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/projects';
import { InferenceServiceModel } from '@odh-dashboard/dashboard-foundation-frontend/api/models/kserve';
import { PodModel } from '@odh-dashboard/dashboard-foundation-frontend/api/models';
import { applyK8sAPIOptions } from '@odh-dashboard/dashboard-foundation-frontend/api/apiMergeUtils';

export const listInferenceService = (
  namespace?: string,
  labelSelector?: string,
  opts?: K8sAPIOptions,
): Promise<InferenceServiceKind[]> => {
  const queryOptions = {
    ...(namespace && { ns: namespace }),
    ...(labelSelector && { queryParams: { labelSelector } }),
  };
  return k8sListResource<InferenceServiceKind>(
    applyK8sAPIOptions(
      {
        model: InferenceServiceModel,
        queryOptions,
      },
      opts,
    ),
  ).then((listResource) => listResource.items);
};

export const listScopedInferenceService = (
  labelSelector?: string,
  opts?: K8sAPIOptions,
): Promise<InferenceServiceKind[]> =>
  getModelServingProjects(opts).then((projects) =>
    Promise.all(
      projects.map((project) => listInferenceService(project.metadata.name, labelSelector, opts)),
    ).then((fetchedListInferenceService) =>
      _.flatten(
        fetchedListInferenceService.map((projectInferenceServices) =>
          _.uniqBy(projectInferenceServices, (is) => is.metadata.name),
        ),
      ),
    ),
  );

export const getInferenceServiceContext = (
  namespace?: string,
  labelSelector?: string,
  opts?: K8sAPIOptions,
): Promise<InferenceServiceKind[]> => {
  if (namespace) {
    return listInferenceService(namespace, labelSelector, opts);
  }
  return listScopedInferenceService(labelSelector, opts);
};

export const getInferenceService = (
  name: string,
  namespace: string,
  opts?: K8sAPIOptions,
): Promise<InferenceServiceKind> =>
  k8sGetResource<InferenceServiceKind>(
    applyK8sAPIOptions(
      {
        model: InferenceServiceModel,
        queryOptions: { name, ns: namespace },
      },
      opts,
    ),
  );

export const getInferenceServicePods = (
  name: string,
  namespace: string,
  opts?: K8sAPIOptions,
): Promise<PodKind[]> =>
  k8sListResource<PodKind>(
    applyK8sAPIOptions(
      {
        model: PodModel,
        queryOptions: {
          ns: namespace,
          queryParams: {
            labelSelector: `serving.kserve.io/inferenceservice=${name}`,
          },
        },
      },
      opts,
    ),
  ).then((listResource) => listResource.items);

export const deleteInferenceService = (
  name: string,
  namespace: string,
  opts?: K8sAPIOptions,
): Promise<K8sStatus> =>
  k8sDeleteResource<InferenceServiceKind, K8sStatus>(
    applyK8sAPIOptions(
      {
        model: InferenceServiceModel,
        queryOptions: { name, ns: namespace },
      },
      opts,
    ),
  );
