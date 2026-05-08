import { mergeWith } from 'lodash';
import {
  PatchUtils,
  V1PersistentVolumeClaim,
  V1Role,
  V1RoleBinding,
} from '@kubernetes/client-node';
import { FastifyRequest } from 'fastify';
import { getClusterStatus, getDashboardConfig } from './resourceUtils';
import { errorHandler } from './backendUtils';
import {
  BYONImagePackage,
  ContainerResources,
  EnvironmentVariable,
  ImageInfo,
  ImageStream,
  ImageStreamTag,
  ImageTag,
  ImageTagInfo,
  KubeFastifyInstance,
  Notebook,
  NotebookData,
  NotebookList,
  RecursivePartial,
  TagContent,
  VolumeMount,
  RouteKind,
  KubeResponseBody,
} from './backendTypes';
import { getUserInfo, usernameTranslate } from './userUtils';
import { createCustomError } from './requestUtils';
import { DEFAULT_PVC_SIZE, IMAGE_ANNOTATIONS, MOUNT_PATH } from './constants';
import { verifyEnvVars } from './envUtils';
import { smartMergeArraysWithNameObjects } from './objUtils';

/** Kubernetes client-node custom object APIs return JSON bodies typed as opaque objects. */
function kubeCustomObjectBody<T>(body: unknown): T {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- upstream customObjectsApi typings do not narrow body
  return body as T;
}

const kubeClientErrorBody = (
  e: unknown,
): { message: string; code: number; statusCode?: number } => {
  let statusCode: number | undefined;
  if (typeof e === 'object' && e !== null && 'statusCode' in e) {
    statusCode = Number(Reflect.get(e, 'statusCode'));
  }

  let bodyMessage: string | undefined;
  let bodyCode: number | undefined;
  if (typeof e === 'object' && e !== null && 'response' in e) {
    const response = Reflect.get(e, 'response');
    if (typeof response === 'object' && response !== null && 'body' in response) {
      const responseBody = Reflect.get(response, 'body');
      if (typeof responseBody === 'object' && responseBody !== null) {
        const messageVal = Reflect.get(responseBody, 'message');
        const codeVal = Reflect.get(responseBody, 'code');
        if (typeof messageVal === 'string') bodyMessage = messageVal;
        if (typeof codeVal === 'number') bodyCode = codeVal;
      }
    }
  }

  return {
    message: bodyMessage ?? errorHandler(e),
    code: typeof bodyCode === 'number' ? bodyCode : 500,
    statusCode: Number.isFinite(statusCode) ? statusCode : undefined,
  };
};

export const generateNotebookNameFromUsername = (username: string): string =>
  `jupyter-nb-${usernameTranslate(username)}`;

export const generatePvcNameFromUsername = (username: string): string =>
  `jupyterhub-nb-${usernameTranslate(username)}-pvc`;

export const generateEnvVarFileNameFromUsername = (username: string): string =>
  `jupyterhub-singleuser-profile-${usernameTranslate(username)}-envs`;

export const getWorkbenchNamespace = (fastify: KubeFastifyInstance): string | undefined => {
  try {
    const clusterStatus = getClusterStatus(fastify);
    const workbenchNamespace = clusterStatus?.components?.workbenches?.workbenchNamespace;

    if (!workbenchNamespace) {
      fastify.log.warn(
        'Workbench namespace not found in cluster status, will fall back to dashboard namespace',
      );
    }

    return workbenchNamespace;
  } catch (error: unknown) {
    fastify.log.error(error, 'Failed to fetch cluster status for workbench namespace:');
    return undefined;
  }
};

export const getNamespaces = (
  fastify: KubeFastifyInstance,
): { dashboardNamespace: string; workbenchNamespace: string } => {
  const config = getDashboardConfig();
  const workbenchNamespace = getWorkbenchNamespace(fastify);
  const fallbackNamespace = config.metadata?.namespace ?? fastify.kube.namespace;

  return {
    workbenchNamespace: workbenchNamespace || fallbackNamespace,
    dashboardNamespace: fallbackNamespace,
  };
};

export const createRBAC = async (
  fastify: KubeFastifyInstance,
  namespace: string,
  notebookData: Notebook,
  username: string,
): Promise<void> => {
  const notebookMetadataName = notebookData.metadata.name ?? '';
  const notebookRole: V1Role = {
    apiVersion: 'rbac.authorization.k8s.io/v1',
    kind: 'Role',
    metadata: {
      name: `${notebookMetadataName}-notebook-view`,
      labels: {
        'opendatahub.io/dashboard': 'true',
      },
    },
    rules: [
      {
        apiGroups: ['kubeflow.org'],
        resources: ['notebooks'],
        resourceNames: [notebookMetadataName],
        verbs: ['get'],
      },
    ],
  };

  const notebookRoleBinding: V1RoleBinding = {
    apiVersion: 'rbac.authorization.k8s.io/v1',
    kind: 'RoleBinding',
    metadata: {
      name: `${notebookMetadataName}-notebook-view`,
      labels: {
        'opendatahub.io/dashboard': 'true',
      },
    },
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'Role',
      name: `${notebookMetadataName}-notebook-view`,
    },
    subjects: [
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: username,
      },
    ],
  };

  await fastify.kube.rbac.createNamespacedRole(namespace, notebookRole);
  await fastify.kube.rbac.createNamespacedRoleBinding(namespace, notebookRoleBinding);
};

const getImageTag = (image: ImageInfo, imageTagName: string): ImageTag => {
  const tag = image.tags.find((candidate) => candidate.name === imageTagName);

  if (!tag) {
    throw Error(`Error getting image tag for image ${image.name}`);
  }

  return {
    image,
    tag,
  };
};

const getMlflowAnnotation = (fastify: KubeFastifyInstance): Record<string, string> => {
  const dscStatus = getClusterStatus(fastify);
  if (dscStatus?.components?.mlflowoperator?.managementState === 'Managed') {
    return { 'opendatahub.io/mlflow-instance': 'mlflow' };
  }
  return {};
};

export const assembleNotebook = async (
  fastify: KubeFastifyInstance,
  data: NotebookData,
  username: string,
  url: string,
  name: string,
  namespace: string,
  pvcName: string,
  envName: string,
): Promise<Notebook> => {
  const { imageName, imageTagName, envVars, podSpecOptions } = data;

  let imageUrl = ``;
  let imageSelection = ``;

  try {
    const image = await getImageInfo(fastify, imageName);

    const selectedImage = getImageTag(image, imageTagName);

    imageUrl = `${selectedImage.image?.dockerImageRepo ?? ''}:${selectedImage.tag?.name ?? ''}`;
    imageSelection = `${selectedImage.image?.name ?? ''}:${selectedImage.tag?.name ?? ''}`;
  } catch (e: unknown) {
    fastify.log.error(`Error getting the image for ${imageName}:${imageTagName}`);
    throw Error(`Error getting the image for ${imageName}:${imageTagName}, ${errorHandler(e)}`);
  }

  const volumes = [
    { name: pvcName, persistentVolumeClaim: { claimName: pvcName } },
    { name: 'shm', emptyDir: { medium: 'Memory' } },
  ];
  const volumeMounts: VolumeMount[] = [
    { mountPath: MOUNT_PATH, name: pvcName },
    { mountPath: '/dev/shm', name: 'shm' },
  ];

  const {
    resources,
    tolerations,
    affinity,
    nodeSelector,
    selectedHardwareProfile,
    lastSizeSelection,
  } = podSpecOptions;

  const translatedUsername = usernameTranslate(username);

  const configMapEnvs = Object.keys(envVars.configMap).map<EnvironmentVariable>((key) => ({
    name: key,
    valueFrom: {
      configMapKeyRef: {
        key,
        name: envName,
      },
    },
  }));

  const secretEnvs = Object.keys(envVars.secrets).map<EnvironmentVariable>((key) => ({
    name: key,
    valueFrom: {
      secretKeyRef: {
        key,
        name: envName,
      },
    },
  }));

  return {
    apiVersion: 'kubeflow.org/v1',
    kind: 'Notebook',
    metadata: {
      labels: {
        app: name,
        'opendatahub.io/odh-managed': 'true',
        'opendatahub.io/dashboard': 'true',
      },
      annotations: {
        'notebooks.opendatahub.io/last-size-selection': lastSizeSelection ?? '',
        'notebooks.opendatahub.io/last-image-selection': imageSelection,
        'opendatahub.io/user': translatedUsername,
        'opendatahub.io/username': username,
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- K8s merge uses null to clear annotation; Notebook annotations type only allows string
        'kubeflow-resource-stopped': null as unknown as string,
        'opendatahub.io/hardware-profile-name': selectedHardwareProfile?.metadata.name || '',
        'opendatahub.io/hardware-profile-namespace':
          selectedHardwareProfile?.metadata.namespace || '',
        ...getMlflowAnnotation(fastify),
      },
      name,
      namespace,
    },
    spec: {
      template: {
        spec: {
          affinity,
          enableServiceLinks: false,
          containers: [
            {
              image: imageUrl,
              imagePullPolicy: 'Always',
              workingDir: MOUNT_PATH,
              name,
              env: [
                {
                  name: 'NOTEBOOK_ARGS',
                  value: `--ServerApp.port=8888
                  --ServerApp.token=''
                  --ServerApp.password=''
                  --ServerApp.base_url=/notebook/${namespace}/${name}
                  --ServerApp.quit_button=False`,
                },
                {
                  name: 'JUPYTER_IMAGE',
                  value: imageUrl,
                },
                ...configMapEnvs,
                ...secretEnvs,
              ],
              resources,
              volumeMounts,
              ports: [
                {
                  name: 'notebook-port',
                  containerPort: 8888,
                  protocol: 'TCP',
                },
              ],
              livenessProbe: {
                initialDelaySeconds: 10,
                periodSeconds: 5,
                timeoutSeconds: 1,
                successThreshold: 1,
                failureThreshold: 3,
                httpGet: {
                  scheme: 'HTTP',
                  path: `/notebook/${namespace}/${name}/api`,
                  port: 'notebook-port',
                },
              },
              readinessProbe: {
                initialDelaySeconds: 10,
                periodSeconds: 5,
                timeoutSeconds: 1,
                successThreshold: 1,
                failureThreshold: 3,
                httpGet: {
                  scheme: 'HTTP',
                  path: `/notebook/${namespace}/${name}/api`,
                  port: 'notebook-port',
                },
              },
            },
          ],
          volumes,
          tolerations: !selectedHardwareProfile ? tolerations : undefined,
          nodeSelector: !selectedHardwareProfile ? nodeSelector : undefined,
        },
      },
    },
  };
};

export const getNotebooks = async (
  fastify: KubeFastifyInstance,
  namespace: string,
  labels?: string,
): Promise<NotebookList> => {
  const kubeResponse = await fastify.kube.customObjectsApi.listNamespacedCustomObject(
    'kubeflow.org',
    'v1',
    namespace,
    'notebooks',
    undefined,
    undefined,
    undefined,
    labels,
  );
  return kubeCustomObjectBody<NotebookList>(kubeResponse.body);
};

export const getNotebook = async (
  fastify: KubeFastifyInstance,
  namespace: string,
  name: string,
): Promise<Notebook> => {
  const kubeResponse = await fastify.kube.customObjectsApi.getNamespacedCustomObject(
    'kubeflow.org',
    'v1',
    namespace,
    'notebooks',
    name,
  );
  return kubeCustomObjectBody<Notebook>(kubeResponse.body);
};

export const stopNotebook = async (
  fastify: KubeFastifyInstance,
  request: FastifyRequest<{
    Body: NotebookData;
  }>,
): Promise<Notebook> => {
  const username = request.body.username || (await getUserInfo(fastify, request)).userName;
  const name = generateNotebookNameFromUsername(username);
  const { workbenchNamespace } = getNamespaces(fastify);

  const dateStr = new Date().toISOString().replace(/\.\d{3}Z/i, 'Z');
  const data: RecursivePartial<Notebook> = {
    metadata: { annotations: { 'kubeflow-resource-stopped': dateStr } },
  };

  const response = await fastify.kube.customObjectsApi.patchNamespacedCustomObject(
    'kubeflow.org',
    'v1',
    workbenchNamespace,
    'notebooks',
    name,
    data,
    undefined,
    undefined,
    undefined,
    {
      headers: { 'Content-type': PatchUtils.PATCH_FORMAT_JSON_MERGE_PATCH },
    },
  );

  return kubeCustomObjectBody<Notebook>(response.body);
};

export const createNotebook = async (
  fastify: KubeFastifyInstance,
  username: string,
  url: string,
  notebookData?: NotebookData,
): Promise<Notebook> => {
  if (!notebookData) {
    const error = createCustomError(
      'Missing Notebook',
      'Request body malformed, missing notebook',
      400,
    );
    fastify.log.error(error.message);
    throw error;
  }

  let notebookAssembled: Notebook;

  try {
    notebookAssembled = await generateNotebookResources(fastify, username, url, notebookData);
  } catch (e: unknown) {
    fastify.log.error(`Failed to generate notebook resources, ${errorHandler(e)}`);
    throw e;
  }

  if (!notebookAssembled.metadata.annotations) {
    notebookAssembled.metadata.annotations = {};
  }

  notebookAssembled.metadata.annotations['notebooks.opendatahub.io/inject-auth'] = 'true';

  const notebookContainers = notebookAssembled.spec.template.spec.containers;

  if (!notebookContainers[0]) {
    const error = createCustomError(
      'Missing notebook containers',
      'No containers found in posted notebook.',
      400,
    );
    fastify.log.error(error);
    throw error;
  }

  notebookContainers[0].env.push({ name: 'JUPYTER_NOTEBOOK_PORT', value: '8888' });
  notebookContainers[0].resources = verifyResources(notebookContainers[0].resources ?? {});

  let notebook: Notebook;
  try {
    const response = await fastify.kube.customObjectsApi.createNamespacedCustomObject(
      'kubeflow.org',
      'v1',
      notebookAssembled.metadata.namespace ?? '',
      'notebooks',
      notebookAssembled,
    );
    notebook = kubeCustomObjectBody<Notebook>(response.body);
  } catch (e: unknown) {
    const { message, code } = kubeClientErrorBody(e);
    const customError = createCustomError('Error creating Notebook Custom Resource', message, code);
    fastify.log.error(customError);
    throw customError;
  }

  try {
    await createRBAC(
      fastify,
      notebookAssembled.metadata.namespace ?? '',
      notebookAssembled,
      username,
    );
  } catch (e: unknown) {
    const { message, code, statusCode } = kubeClientErrorBody(e);
    if (statusCode === 409) {
      // Conflict, we likely have one already -- just continue
      fastify.log.warn(
        'Requested to recreate RBAC piece of create Notebook. Got a conflict, assuming it is already there and letting the flow continue.',
      );
    } else {
      const customError = createCustomError('Error creating Notebook RBAC', message, code);
      fastify.log.error(customError);
      throw customError;
    }
  }

  return notebook;
};

export const updateNotebook = async (
  fastify: KubeFastifyInstance,
  username: string,
  url: string,
  notebookData: NotebookData,
  oldNotebook: Notebook,
): Promise<Notebook> => {
  try {
    const serverNotebook = await generateNotebookResources(fastify, username, url, notebookData);

    // Fix for Workbench Certs that get overridden
    // We are intentionally applying on some details as to avoid implementing logic to properly
    // manage the notebook the same way as workbench
    const preservedEnv = oldNotebook.spec.template.spec.containers[0].env.filter(
      ({ valueFrom }) => {
        if (!valueFrom) {
          return true;
        }
        const value = valueFrom.secretKeyRef ?? valueFrom.configMapKeyRef;
        return !value?.name.startsWith('jupyterhub-singleuser-profile');
      },
    );
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- mergeWith RecursivePartial<Notebook> is not satisfied by EnvironmentVariable[] for env
    const preservedNotebookEnvVars = preservedEnv as RecursivePartial<EnvironmentVariable>[];
    const importantOldNotebookDetails: RecursivePartial<Notebook> = {
      spec: {
        template: {
          spec: {
            containers: [
              {
                // Drop all env vars we added in the past, because we will just add them back if they are still there
                env: preservedNotebookEnvVars,
                volumeMounts: oldNotebook.spec.template.spec.containers[0].volumeMounts,
              },
            ],
            volumes: oldNotebook.spec.template.spec.volumes,
          },
        },
      },
    };

    const notebookAssembled = mergeWith(
      {},
      importantOldNotebookDetails,
      serverNotebook,
      smartMergeArraysWithNameObjects,
    );

    const response = await fastify.kube.customObjectsApi.patchNamespacedCustomObject(
      'kubeflow.org',
      'v1',
      notebookAssembled.metadata.namespace ?? '',
      'notebooks',
      notebookAssembled.metadata.name ?? '',
      notebookAssembled,
      undefined,
      undefined,
      undefined,
      {
        headers: { 'Content-type': PatchUtils.PATCH_FORMAT_JSON_MERGE_PATCH },
      },
    );
    return kubeCustomObjectBody<Notebook>(response.body);
  } catch (e: unknown) {
    fastify.log.error(`Failed to update notebook resources, ${errorHandler(e)}`);
    throw e;
  }
};

export const verifyResources = (resources: ContainerResources): ContainerResources => {
  if (resources.requests && !resources.limits) {
    return { ...resources, limits: resources.requests };
  }

  //TODO: verify if resources can fit on node

  return resources;
};

const generateNotebookResources = async (
  fastify: KubeFastifyInstance,
  username: string,
  url: string,
  notebookData: NotebookData,
): Promise<Notebook> => {
  const name = generateNotebookNameFromUsername(username);
  const pvcName = generatePvcNameFromUsername(username);
  const envName = generateEnvVarFileNameFromUsername(username);
  const namespace = getNamespaces(fastify).workbenchNamespace;

  // generate pvc
  try {
    await fastify.kube.coreV1Api.readNamespacedPersistentVolumeClaim(pvcName, namespace);
  } catch (e: unknown) {
    const { statusCode } = kubeClientErrorBody(e);
    if (statusCode === 404) {
      await createPvc(fastify, namespace, pvcName, notebookData.storageClassName);
    } else {
      throw e;
    }
  }

  //generate env variables
  await verifyEnvVars(fastify, namespace, envName, notebookData.envVars);
  return assembleNotebook(fastify, notebookData, username, url, name, namespace, pvcName, envName);
};

const createPvc = async (
  fastify: KubeFastifyInstance,
  namespace: string,
  pvcName: string,
  storageClassName?: string,
): Promise<V1PersistentVolumeClaim> => {
  const pvcSize = getDashboardConfig().spec.notebookController?.pvcSize ?? DEFAULT_PVC_SIZE;
  const preferredStorageClassName =
    getDashboardConfig().spec.notebookController?.storageClassName ?? storageClassName;
  const pvc = assemblePvc(pvcName, namespace, pvcSize, preferredStorageClassName);

  try {
    const pvcResponse = await fastify.kube.coreV1Api.createNamespacedPersistentVolumeClaim(
      namespace,
      pvc,
    );
    return pvcResponse.body;
  } catch (e: unknown) {
    throw Error(`PVC ${pvcName} could not be read, ${errorHandler(e)}`);
  }
};

const assemblePvc = (
  pvcName: string,
  namespace: string,
  pvcSize: string,
  storageClassName?: string,
): V1PersistentVolumeClaim => ({
  apiVersion: 'v1',
  kind: 'PersistentVolumeClaim',
  metadata: {
    name: pvcName,
    namespace,
    labels: {
      'opendatahub.io/dashboard': 'true',
    },
  },
  spec: {
    accessModes: ['ReadWriteOnce'],
    resources: {
      requests: {
        storage: pvcSize,
      },
    },
    volumeMode: 'Filesystem',
    storageClassName,
  },
  status: {
    phase: 'Pending',
  },
});

const getImage = async (fastify: KubeFastifyInstance, imageName: string): Promise<ImageStream> => {
  return fastify.kube.customObjectsApi
    .getNamespacedCustomObject(
      'image.openshift.io',
      'v1',
      fastify.kube.namespace,
      'imagestreams',
      imageName,
    )
    .then((res) => kubeCustomObjectBody<ImageStream>(res.body));
};

export const getImageInfo = async (
  fastify: KubeFastifyInstance,
  imageName: string,
): Promise<ImageInfo> => {
  return getImage(fastify, imageName).then((res) => {
    return processImageInfo(res);
  });
};

export const processImageInfo = (imageStream: ImageStream): ImageInfo => {
  const annotations = imageStream.metadata.annotations || {};

  const imageInfo: ImageInfo = {
    name: imageStream.metadata.name,
    description: annotations[IMAGE_ANNOTATIONS.DESC] || '',
    url: annotations[IMAGE_ANNOTATIONS.URL] || '',
    // eslint-disable-next-line camelcase
    display_name: annotations[IMAGE_ANNOTATIONS.DISP_NAME] || imageStream.metadata.name,
    tags: getTagInfo(imageStream),
    order: +annotations[IMAGE_ANNOTATIONS.IMAGE_ORDER] || 100,
    dockerImageRepo: imageStream.status?.dockerImageRepository || '',
    error: isBYONImage(imageStream) ? getBYONImageErrorMessage(imageStream) : undefined,
  };

  return imageInfo;
};

const getTagInfo = (imageStream: ImageStream): ImageTagInfo[] => {
  const tagInfoArray: ImageTagInfo[] = [];
  const { tags } = imageStream.spec;
  if (!tags?.length) {
    console.error(`${imageStream.metadata.name} does not have any tags.`);
    return [];
  }
  tags.forEach((tag) => {
    const tagAnnotations = tag.annotations ?? {};
    if (!checkTagExistence(tag, imageStream)) {
      return; //Skip tag
    }
    if (tagAnnotations[IMAGE_ANNOTATIONS.OUTDATED]) {
      return; // tag is outdated - we want to keep it around for existing notebooks, not for new ones
    }

    const tagInfo: ImageTagInfo = {
      content: getTagContent(tag),
      name: tag.name,
      recommended: JSON.parse(tagAnnotations[IMAGE_ANNOTATIONS.RECOMMENDED] || 'false'),
      default: JSON.parse(tagAnnotations[IMAGE_ANNOTATIONS.DEFAULT] || 'false'),
    };
    tagInfoArray.push(tagInfo);
  });
  return tagInfoArray;
};

// Check for existence in status.tags
const checkTagExistence = (tag: ImageStreamTag, imageStream: ImageStream): boolean => {
  if (imageStream.status) {
    const { tags } = imageStream.status;
    if (tags) {
      for (let i = 0; i < tags.length; i++) {
        if (tags[i].tag === tag.name) {
          return true;
        }
      }
    }
  }
  return false;
};

const getTagContent = (tag: ImageStreamTag): TagContent => {
  const ann = tag.annotations ?? {};
  const content: TagContent = {
    software: jsonParsePackage(ann[IMAGE_ANNOTATIONS.SOFTWARE] ?? ''),
    dependencies: jsonParsePackage(ann[IMAGE_ANNOTATIONS.DEPENDENCIES] ?? ''),
  };
  return content;
};

const jsonParsePackage = (unparsedPackage: string): BYONImagePackage[] => {
  try {
    return JSON.parse(unparsedPackage) || [];
  } catch {
    return [];
  }
};

const isBYONImage = (imageStream: ImageStream) =>
  imageStream.metadata.labels?.['app.kubernetes.io/created-by'] === 'byon';

const getBYONImageErrorMessage = (imageStream: ImageStream) => {
  // there will be always only 1 tag in the spec for BYON images
  // status tags could be more than one
  const activeTag = imageStream.status?.tags?.find(
    (statusTag) => statusTag.tag === imageStream.spec.tags?.[0].name,
  );
  return activeTag?.conditions?.[0]?.message;
};

export const getRoute = async (
  fastify: KubeFastifyInstance,
  namespace: string,
  routeName: string,
): Promise<RouteKind> => {
  const kubeResponse = await fastify.kube.customObjectsApi
    .listNamespacedCustomObject(
      'route.openshift.io',
      'v1',
      namespace,
      'routes',
      undefined,
      undefined,
      undefined,
      `notebook-name=${routeName}`,
    )
    .catch((res) => {
      const e = res.response.body;
      const error = createCustomError('Error listing Routes', e.message, e.code);
      fastify.log.error(error);
      throw error;
    });

  const routes = kubeCustomObjectBody<KubeResponseBody<RouteKind>>(kubeResponse.body).items ?? [];
  const matched = routes.find(
    (r: RouteKind) => r.metadata?.labels?.['notebook-name'] === routeName,
  );

  if (!matched) {
    const error = createCustomError(
      'Error getting Route',
      `Route with label notebook-name=${routeName} not found`,
      404,
    );
    fastify.log.error(error);
    throw error;
  }

  return matched;
};
