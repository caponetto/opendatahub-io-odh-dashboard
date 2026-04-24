import { FastifyReply } from 'fastify';
import { DataScienceClusterKindStatus, KubeFastifyInstance, PlatformType } from '../../../types';
import { getClusterStatus } from '../../../utils/resourceUtils';

const managed = { managementState: 'Managed' as const };

const VANILLA_K8S_DSC_STATUS: DataScienceClusterKindStatus = {
  conditions: [],
  phase: 'Ready',
  release: {
    name: 'opendatahub',
  },
  components: {
    dashboard: managed,
    kserve: managed,
    aipipelines: managed,
    kueue: managed,
    modelregistry: { managementState: 'Managed', registriesNamespace: 'odh-dashboard' },
    ray: managed,
    trainingoperator: managed,
    trustyai: managed,
    workbenches: { managementState: 'Managed', workbenchNamespace: 'odh-dashboard' },
    trainer: managed,
  } as DataScienceClusterKindStatus['components'],
};

module.exports = async (fastify: KubeFastifyInstance) => {
  fastify.get('/status', async (_req, reply: FastifyReply) => {
    if (fastify.kube.platform !== PlatformType.OpenShift) {
      return VANILLA_K8S_DSC_STATUS;
    }
    const status = getClusterStatus(fastify);
    if (!status) {
      return reply.code(404).send();
    }
    return status;
  });
};
