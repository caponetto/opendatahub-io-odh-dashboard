import * as _ from 'lodash-es';
import { k8sDeleteResource, k8sListResource } from '@odh-dashboard/k8s-browser';
import type {
  K8sAPIOptions,
  ServingRuntimeKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { getModelServingProjects } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/projects';
import { ServingRuntimeModel } from '@odh-dashboard/dashboard-foundation-frontend/api/models/kserve';
import { applyK8sAPIOptions } from '@odh-dashboard/dashboard-foundation-frontend/api/apiMergeUtils';

export const listServingRuntimes = (
  namespace?: string,
  labelSelector?: string,
  opts?: K8sAPIOptions,
): Promise<ServingRuntimeKind[]> => {
  const queryOptions = {
    ...(namespace && { ns: namespace }),
    ...(labelSelector && { queryParams: { labelSelector } }),
  };
  return k8sListResource<ServingRuntimeKind>(
    applyK8sAPIOptions(
      {
        model: ServingRuntimeModel,
        queryOptions,
      },
      opts,
    ),
  ).then((listResource) => listResource.items);
};

export const listScopedServingRuntimes = (
  labelSelector?: string,
  opts?: K8sAPIOptions,
): Promise<ServingRuntimeKind[]> =>
  getModelServingProjects(opts).then((projects) =>
    Promise.all(
      projects.map((project) => listServingRuntimes(project.metadata.name, labelSelector, opts)),
    ).then((fetchedListServingRuntimes) =>
      _.uniqBy(_.flatten(fetchedListServingRuntimes), (sr) => sr.metadata.name),
    ),
  );

export const getServingRuntimeContext = (
  namespace?: string,
  labelSelector?: string,
  opts?: K8sAPIOptions,
): Promise<ServingRuntimeKind[]> => {
  if (namespace) {
    return listServingRuntimes(namespace, labelSelector, opts);
  }
  return listScopedServingRuntimes(labelSelector, opts);
};

export const deleteServingRuntime = (
  name: string,
  namespace: string,
  opts?: K8sAPIOptions,
): Promise<ServingRuntimeKind> =>
  k8sDeleteResource<ServingRuntimeKind>(
    applyK8sAPIOptions(
      {
        model: ServingRuntimeModel,
        queryOptions: { name, ns: namespace },
      },
      opts,
    ),
  );
