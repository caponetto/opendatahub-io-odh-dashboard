/* eslint-disable @typescript-eslint/consistent-type-assertions -- K8s error response shapes */
import { Buffer } from 'buffer';
import {
  KubeFastifyInstance,
  ODHSegmentKey,
} from '@odh-dashboard/dashboard-foundation-backend/backendTypes';
import { errorHandler } from '@odh-dashboard/dashboard-foundation-backend/backendUtils';

export const getSegmentKey = async (fastify: KubeFastifyInstance): Promise<ODHSegmentKey> => {
  const { coreV1Api } = fastify.kube;
  const { namespace } = fastify.kube;
  let segmentKeyEnabled = true;
  let decodedSegmentKey = '';
  try {
    const resEnabled = await coreV1Api.readNamespacedConfigMap('odh-segment-key-config', namespace);
    segmentKeyEnabled = resEnabled.body.data?.segmentKeyEnabled === 'true';
    if (segmentKeyEnabled) {
      const res = await coreV1Api.readNamespacedSecret('odh-segment-key', namespace);
      const encoded = res.body.data?.segmentKey;
      if (encoded == null || encoded === '') {
        decodedSegmentKey = '';
      } else {
        decodedSegmentKey = String(Buffer.from(encoded, 'base64'));
      }
    } else {
      decodedSegmentKey = '';
    }
    return {
      segmentKey: decodedSegmentKey,
    };
  } catch (e: unknown) {
    const statusCode =
      typeof e === 'object' &&
      e !== null &&
      'response' in e &&
      typeof (e as { response?: { statusCode?: number } }).response?.statusCode === 'number'
        ? (e as { response: { statusCode: number } }).response.statusCode
        : undefined;
    if (segmentKeyEnabled && statusCode !== 404) {
      fastify.log.error(`load segment key error: ${errorHandler(e)}`);
    }
    return {
      segmentKey: '',
    };
  }
};
