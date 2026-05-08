import * as React from 'react';
import { useAccessReview } from '@odh-dashboard/dashboard-foundation-frontend/api';
import {
  AccessReviewResourceAttributes,
  InferenceServiceKind,
  KnownLabels,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { ListWithNonDashboardPresence } from '@odh-dashboard/dashboard-foundation-frontend/types';
import useFetch, {
  FetchOptions,
  FetchStateObject,
  FetchStateCallbackPromise,
  NotReadyError,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetch';
import { DEFAULT_LIST_WITH_NON_DASHBOARD_PRESENCE } from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import useModelServingEnabled from './useModelServingEnabled';
import { getInferenceServiceContext, listInferenceService } from '../api/k8s/inferenceServices';

const accessReviewResource: AccessReviewResourceAttributes = {
  group: 'serving.kserve.io',
  resource: 'inferenceservices',
  verb: 'list',
};

const useInferenceServices = (
  namespace?: string,
  registeredModelId?: string,
  modelVersionId?: string,
  mrName?: string,
  fetchOptions?: Partial<FetchOptions>,
): FetchStateObject<ListWithNonDashboardPresence<InferenceServiceKind>> => {
  const modelServingEnabled = useModelServingEnabled();

  const [allowCreate, rbacLoaded] = useAccessReview({
    ...accessReviewResource,
  });

  const callback = React.useCallback<
    FetchStateCallbackPromise<ListWithNonDashboardPresence<InferenceServiceKind>>
  >(
    async (opts) => {
      if (!modelServingEnabled) {
        return Promise.reject(new NotReadyError('Model serving is not enabled'));
      }

      if (!rbacLoaded) {
        return Promise.reject(new NotReadyError('Fetch is not ready'));
      }

      const getInferenceServices = allowCreate ? listInferenceService : getInferenceServiceContext;

      let inferenceServiceList = await getInferenceServices(
        namespace,
        [
          ...(registeredModelId ? [`${KnownLabels.REGISTERED_MODEL_ID}=${registeredModelId}`] : []),
          ...(modelVersionId ? [`${KnownLabels.MODEL_VERSION_ID}=${modelVersionId}`] : []),
        ].join(','),
        opts,
      );

      if (mrName) {
        inferenceServiceList = inferenceServiceList.filter(
          (inferenceService) =>
            inferenceService.metadata.labels?.[KnownLabels.MODEL_REGISTRY_NAME] === mrName ||
            !inferenceService.metadata.labels?.[KnownLabels.MODEL_REGISTRY_NAME],
        );
      }

      const dashboardInferenceServices = inferenceServiceList.filter(
        ({ metadata: { labels } }) => labels?.[KnownLabels.DASHBOARD_RESOURCE] === 'true',
      );
      return {
        items: dashboardInferenceServices,
        hasNonDashboardItems: inferenceServiceList.length > dashboardInferenceServices.length,
      };
    },
    [
      modelServingEnabled,
      rbacLoaded,
      allowCreate,
      namespace,
      registeredModelId,
      modelVersionId,
      mrName,
    ],
  );

  return useFetch(callback, DEFAULT_LIST_WITH_NON_DASHBOARD_PRESENCE, {
    initialPromisePurity: true,
    ...fetchOptions,
  });
};

export default useInferenceServices;
