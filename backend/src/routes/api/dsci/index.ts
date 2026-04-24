import { FastifyReply } from 'fastify';
import { getClusterInitialization } from '../../../utils/dsci';
import {
  DataScienceClusterInitializationKindStatus,
  KubeFastifyInstance,
  PlatformType,
} from '../../../types';

const VANILLA_K8S_DSCI_STATUS: DataScienceClusterInitializationKindStatus = {
  conditions: [],
  phase: 'Ready',
};

module.exports = async (fastify: KubeFastifyInstance) => {
  fastify.get('/status', async (_req, reply: FastifyReply) => {
    if (fastify.kube.platform !== PlatformType.OpenShift) {
      return VANILLA_K8S_DSCI_STATUS;
    }
    const status = await getClusterInitialization(fastify);
    if (!status) {
      return reply.code(404).send();
    }
    return status;
  });
};
