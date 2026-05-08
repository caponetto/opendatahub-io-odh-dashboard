import { V1ConfigMap, V1Secret } from '@kubernetes/client-node';
import {
  EnvVarReducedTypeKeyValues,
  EnvVarResource,
  KubeFastifyInstance,
  ResourceConstructor,
  ResourceCreator,
  ResourceGetter,
  ResourceUpdater,
} from './backendTypes';

export const getSecret = (
  fastify: KubeFastifyInstance,
  namespace: string,
  name: string,
): Promise<V1Secret> => {
  return fastify.kube.coreV1Api
    .readNamespacedSecret(name, namespace)
    .then((response) => response.body);
};

const createSecret = (fastify: KubeFastifyInstance, secret: V1Secret): Promise<V1Secret> => {
  return fastify.kube.coreV1Api
    .createNamespacedSecret(secret.metadata?.namespace ?? '', secret)
    .then((response) => response.body);
};

const updateSecret = (fastify: KubeFastifyInstance, secret: V1Secret): Promise<V1Secret> => {
  return fastify.kube.coreV1Api
    .replaceNamespacedSecret(secret.metadata?.name ?? '', secret.metadata?.namespace ?? '', secret)
    .then((response) => response.body);
};

export const getConfigMap = (
  fastify: KubeFastifyInstance,
  namespace: string,
  name: string,
): Promise<V1ConfigMap> => {
  return fastify.kube.coreV1Api
    .readNamespacedConfigMap(name, namespace)
    .then((response) => response.body);
};

const createConfigMap = (
  fastify: KubeFastifyInstance,
  secret: V1ConfigMap,
): Promise<V1ConfigMap> => {
  return fastify.kube.coreV1Api
    .createNamespacedConfigMap(secret.metadata?.namespace ?? '', secret)
    .then((response) => response.body);
};

const updateConfigMap = (
  fastify: KubeFastifyInstance,
  secret: V1ConfigMap,
): Promise<V1ConfigMap> => {
  return fastify.kube.coreV1Api
    .replaceNamespacedConfigMap(
      secret.metadata?.name ?? '',
      secret.metadata?.namespace ?? '',
      secret,
    )
    .then((response) => response.body);
};

export const verifyEnvVars = async (
  fastify: KubeFastifyInstance,
  namespace: string,
  name: string,
  resources: EnvVarReducedTypeKeyValues,
): Promise<void[]> => {
  return Promise.all([
    verifyEnv(
      fastify,
      namespace,
      name,
      resources.secrets,
      generateSecret,
      getSecret,
      createSecret,
      updateSecret,
    ),
    verifyEnv(
      fastify,
      namespace,
      name,
      resources.configMap,
      generateConfigMap,
      getConfigMap,
      createConfigMap,
      updateConfigMap,
    ),
  ]).catch((e: unknown) => {
    const msg = readK8sApiErrorMessage(e);
    fastify.log.error(`Error verifying env vars, ${msg}`);
    throw e;
  });
};

const readK8sApiErrorMessage = (e: unknown): string => {
  if (typeof e !== 'object' || e === null || !('response' in e)) {
    return e instanceof Error ? e.message : String(e);
  }
  const response = Reflect.get(e, 'response');
  if (typeof response !== 'object' || response === null || !('body' in response)) {
    return e instanceof Error ? e.message : String(e);
  }
  const body = Reflect.get(response, 'body');
  if (typeof body !== 'object' || body === null || !('message' in body)) {
    return e instanceof Error ? e.message : String(e);
  }
  const message = Reflect.get(body, 'message');
  return typeof message === 'string' ? message : e instanceof Error ? e.message : String(e);
};

const verifyEnv = async (
  fastify: KubeFastifyInstance,
  namespace: string,
  name: string,
  resource: Record<string, string>,
  constructorFunc: ResourceConstructor<EnvVarResource>,
  fetchFunc: ResourceGetter<EnvVarResource>,
  createFunc: ResourceCreator<EnvVarResource>,
  updateFunc: ResourceUpdater<EnvVarResource>,
): Promise<void> => {
  const envObject = constructorFunc(namespace, name, resource);
  return fetchFunc(fastify, namespace, name)
    .then(async () => {
      // Env vars existed and he replaced them (body could be empty)
      await updateFunc(fastify, envObject);
    })
    .catch((error) => {
      if (error.statusCode !== 404) {
        throw error;
      }
      // Env vars didn't exist and we have new env vars
      return createFunc(fastify, envObject).then(() => undefined);
    });
};

const generateSecret = (
  namespace: string,
  name: string,
  secrets: Record<string, string>,
): V1Secret => {
  return {
    apiVersion: 'v1',
    kind: 'Secret',
    metadata: {
      name,
      namespace,
      labels: {
        'opendatahub.io/dashboard': 'true',
      },
    },
    stringData: secrets,
    type: 'Opaque',
  };
};

const generateConfigMap = (
  namespace: string,
  name: string,
  configmap: Record<string, string>,
): V1ConfigMap => {
  return {
    apiVersion: 'v1',
    kind: 'ConfigMap',
    metadata: {
      name,
      namespace,
      labels: {
        'opendatahub.io/dashboard': 'true',
      },
    },
    data: configmap,
  };
};
