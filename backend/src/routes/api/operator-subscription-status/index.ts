import { KubeFastifyInstance, PlatformType, SubscriptionStatusData } from '../../../types';
import { secureRoute } from '../../../utils/route-security';
import { getSubscriptions, isRHOAI } from '../../../utils/resourceUtils';
import { createCustomError } from '../../../utils/requestUtils';

const VANILLA_K8S_SUBSCRIPTION: SubscriptionStatusData = {
  channel: 'N/A',
  lastUpdated: new Date().toISOString(),
};

module.exports = async (fastify: KubeFastifyInstance) => {
  fastify.get(
    '/',
    secureRoute(fastify)(async () => {
      if (fastify.kube.platform !== PlatformType.OpenShift) {
        return VANILLA_K8S_SUBSCRIPTION;
      }
      const subscriptions = getSubscriptions();
      const subNamePrefix = isRHOAI(fastify) ? 'rhods-operator' : 'opendatahub-operator';
      const operatorSubscriptionStatus = subscriptions.find((sub) =>
        sub.installedCSV?.includes(subNamePrefix),
      );
      if (operatorSubscriptionStatus) {
        return operatorSubscriptionStatus;
      }
      fastify.log.error(`Failed to find operator subscription, ${subNamePrefix}`);
      throw createCustomError(
        'Subscription unavailable',
        'Unable to get subscription information',
        404,
      );
    }),
  );
};
