import {
  DataScienceClusterKind,
  DataScienceClusterKindStatus,
  DataScienceClusterList,
  KubeFastifyInstance,
} from '../types';
import { createCustomError } from './requestUtils';

export const fetchClusterStatus = async (
  fastify: KubeFastifyInstance,
): Promise<DataScienceClusterKindStatus> => {
  const result: DataScienceClusterKind | null = await fastify.kube.customObjectsApi
    .listClusterCustomObject('datasciencecluster.opendatahub.io', 'v2', 'datascienceclusters')
    .then((res) => (res.body as DataScienceClusterList).items[0])
    .catch((e) => {
      fastify.log.debug(`DSC not available: ${e.response?.body ?? e.message}`);
      return null;
    });

  if (!result) {
    // May not be using v2 Operator
    throw createCustomError('DSC Unavailable', 'Unable to get status', 404);
  }

  return result.status;
};
