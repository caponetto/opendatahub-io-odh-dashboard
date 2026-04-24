import {
  k8sCreateResource,
  k8sDeleteResource,
  k8sListResource,
  K8sModelCommon,
  K8sResourceCommon,
  k8sUpdateResource,
} from '@openshift/dynamic-plugin-sdk-utils';
import axios from '#~/utilities/axios';
import { CustomWatchK8sResult } from '#~/types';
import { K8sAPIOptions, ProjectKind } from '#~/k8sTypes';
import { NamespaceModel, ProjectModel, ProjectRequestModel } from '#~/api/models';
import { throwErrorFromAxios } from '#~/api/errorUtils';
import { translateDisplayNameForK8s } from '#~/concepts/k8s/utils';
import { ODH_PRODUCT_NAME } from '#~/utilities/const';
import { LABEL_SELECTOR_DASHBOARD_RESOURCE } from '#~/const';
import { NamespaceApplicationCase } from '#~/pages/projects/types';
import { applyK8sAPIOptions } from '#~/api/apiMergeUtils';
import { groupVersionKind } from '#~/api/k8sUtils';
import useK8sWatchResourceList from '#~/utilities/useK8sWatchResourceList';
import { useAppSelector } from '#~/redux/hooks';
import { PlatformType } from '#~/redux/types';

export const useProjectModel = (): K8sModelCommon => {
  const platform = useAppSelector((state) => state.platform);
  return platform === PlatformType.Kubernetes ? NamespaceModel : ProjectModel;
};

export const useProjects = (): CustomWatchK8sResult<ProjectKind[]> => {
  const model = useProjectModel();
  return useK8sWatchResourceList(
    {
      isList: true,
      groupVersionKind: groupVersionKind(model),
    },
    model,
  );
};

export const getProjects = (
  withLabel?: string,
  opts?: K8sAPIOptions,
  platform?: PlatformType,
): Promise<ProjectKind[]> => {
  const listWithModel = (model: typeof ProjectModel) =>
    k8sListResource<ProjectKind>(
      applyK8sAPIOptions(
        {
          model,
          queryOptions: withLabel ? { queryParams: { labelSelector: withLabel } } : undefined,
        },
        opts,
      ),
    ).then((listResource) => listResource.items);

  if (platform === PlatformType.Kubernetes) {
    return listWithModel(NamespaceModel);
  }

  return listWithModel(ProjectModel).catch(() => listWithModel(NamespaceModel));
};

export const createProject = (
  username: string,
  displayName: string,
  description: string,
  k8sName?: string,
  platform?: PlatformType,
): Promise<string> => {
  const name = k8sName || translateDisplayNameForK8s(displayName);

  if (platform === PlatformType.Kubernetes) {
    return k8sCreateResource<ProjectKind>({
      model: NamespaceModel,
      resource: {
        apiVersion: 'v1',
        kind: 'Namespace',
        metadata: {
          name: k8sName || translateDisplayNameForK8s(name),
          annotations: {
            'openshift.io/display-name': displayName,
            'openshift.io/description': description,
          },
          labels: {
            'opendatahub.io/dashboard': 'true',
          },
        },
      },
    }).then((ns) => {
      const projectName = ns.metadata.name;
      return axios(`/api/namespaces/${projectName}/0`)
        .then((response) => {
          const applied = response.data?.applied ?? false;
          if (!applied) {
            throw new Error(
              `Unable to fully create your project. Ask a ${ODH_PRODUCT_NAME} admin for assistance.`,
            );
          }
          return projectName;
        })
        .catch(throwErrorFromAxios);
    });
  }

  type ProjectRequestKind = K8sResourceCommon & {
    metadata: {
      name: string;
    };
    displayName?: string;
    description?: string;
  };

  return new Promise((resolve, reject) => {
    k8sCreateResource<ProjectRequestKind, ProjectKind>({
      model: ProjectRequestModel,
      resource: {
        apiVersion: 'project.openshift.io/v1',
        kind: 'ProjectRequest',
        metadata: {
          name: k8sName || translateDisplayNameForK8s(name),
        },
        description,
        displayName,
      },
    })
      .then((project) => {
        const projectName = project.metadata.name;

        axios(`/api/namespaces/${projectName}/0`)
          .then((response) => {
            const applied = response.data?.applied ?? false;

            if (!applied) {
              throw new Error(
                `Unable to fully create your project. Ask a ${ODH_PRODUCT_NAME} admin for assistance.`,
              );
            }

            resolve(projectName);
          })
          .catch(throwErrorFromAxios)
          .catch(reject);
      })
      .catch(reject);
  });
};

export const getModelServingProjects = (opts?: K8sAPIOptions): Promise<ProjectKind[]> =>
  getProjects(LABEL_SELECTOR_DASHBOARD_RESOURCE, opts);

export const addSupportServingPlatformProject = (
  name: string,
  servingPlatform: NamespaceApplicationCase,
  dryRun = false,
): Promise<string> =>
  axios(`/api/namespaces/${name}/${servingPlatform}`, {
    params: dryRun ? { dryRun: 'All' } : {},
  })
    .then((response) => {
      const applied = response.data?.applied ?? false;
      if (!applied) {
        throw new Error(
          `Unable to select a model serving platform in your project. Ask a ${ODH_PRODUCT_NAME} admin for assistance.`,
        );
      }
      return name;
    })
    .catch(throwErrorFromAxios);

export const updateProject = (
  editProjectData: ProjectKind,
  displayName: string,
  description: string,
  platform?: PlatformType,
): Promise<ProjectKind> => {
  const model = platform === PlatformType.Kubernetes ? NamespaceModel : ProjectModel;
  const resource: ProjectKind = {
    ...editProjectData,
    metadata: {
      ...editProjectData.metadata,
      annotations: {
        ...editProjectData.metadata.annotations,
        'openshift.io/display-name': displayName.trim(),
        'openshift.io/description': description,
      },
    },
  };

  return k8sUpdateResource<ProjectKind>({
    model,
    resource,
  });
};

export const deleteProject = (
  projectName: string,
  platform?: PlatformType,
): Promise<ProjectKind> => {
  const model = platform === PlatformType.Kubernetes ? NamespaceModel : ProjectModel;
  return k8sDeleteResource<ProjectKind>({
    model,
    queryOptions: { name: projectName },
  });
};
