import {
  DataScienceClusterInitializationKind,
  DataScienceClusterInitializationKindStatus,
  DataScienceClusterInitializationList,
  KubeFastifyInstance,
} from '../types';

export const getClusterInitialization = async (
  fastify: KubeFastifyInstance,
): Promise<DataScienceClusterInitializationKindStatus | null> => {
  const result: DataScienceClusterInitializationKind | null = await fastify.kube.customObjectsApi
    .listClusterCustomObject('dscinitialization.opendatahub.io', 'v1', 'dscinitializations')
    .then((res) => (res.body as DataScienceClusterInitializationList).items[0])
    .catch((e) => {
      fastify.log.debug(`DSCI not available: ${e.response?.body ?? e.message}`);
      return null;
    });

  if (!result) {
    return null;
  }

  return result.status;
};
