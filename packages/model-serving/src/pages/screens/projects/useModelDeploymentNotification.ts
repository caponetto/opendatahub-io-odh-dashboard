import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import useNotification from '@odh-dashboard/dashboard-foundation-frontend/utilities/useNotification';
import {
  NotificationResponseStatus,
  NotificationWatcherContext,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/notificationWatcher/NotificationWatcherContext';
import { FAST_POLL_INTERVAL } from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import { ModelDeploymentState } from '@odh-dashboard/model-serving-shared/concepts/modelServing/deploymentState';
import { getInferenceService } from '../../../api/k8s/inferenceServices';
import {
  getInferenceServiceLastFailureReason,
  getInferenceServiceModelState,
} from '../../../concepts/kserve/kserveStatusUtils';
import { useModelStatus } from '../global/useModelStatus';
import { getInferenceServiceStoppedStatus } from '../../utils';

type ModelDeploymentNotification = {
  watchDeployment: () => void;
};

export const useModelDeploymentNotification = (
  namespace: string,
  modelName: string,
): ModelDeploymentNotification => {
  const navigate = useNavigate();
  const notification = useNotification();
  const { registerNotification } = React.useContext(NotificationWatcherContext);
  const [modelStatus] = useModelStatus(namespace, modelName);
  const lastSeenState = React.useRef<ModelDeploymentState | null>(null);

  const watchDeployment = React.useCallback(() => {
    registerNotification({
      callbackDelay: FAST_POLL_INTERVAL,
      callback: async (signal) => {
        // Early failure detection from pod scheduling
        if (modelStatus?.failedToSchedule) {
          notification.error(
            'Model deployment failed',
            'Insufficient resources to schedule the model deployment. Please check your resource quotas and try again.',
            [
              {
                title: 'View deployment',
                onClick: () => navigate(`/ai-hub/deployments/${namespace}`),
              },
            ],
          );
          return { status: NotificationResponseStatus.STOP };
        }

        try {
          const inferenceService = await getInferenceService(modelName, namespace, { signal });

          const baseStatus = getInferenceServiceStoppedStatus(inferenceService);
          const inferenceServiceModelState = getInferenceServiceModelState(inferenceService);

          const { isStopped } = baseStatus;
          const isStarting =
            !inferenceService.status?.modelStatus?.states?.activeModelState &&
            inferenceService.status?.modelStatus?.states?.targetModelState !==
              ModelDeploymentState.FAILED_TO_LOAD &&
            !baseStatus.isStopped;

          const isRunning = inferenceServiceModelState === ModelDeploymentState.LOADED;

          // Track previous state
          const lastState = lastSeenState.current;
          lastSeenState.current = inferenceServiceModelState;

          // Only consider it failed if it's not stopped, the state is FAILED_TO_LOAD, and the last state was PENDING
          const isFailed =
            !isStopped &&
            inferenceServiceModelState === ModelDeploymentState.FAILED_TO_LOAD &&
            lastState === ModelDeploymentState.PENDING;

          const lastFailureReason = getInferenceServiceLastFailureReason(inferenceService);

          if (isFailed) {
            notification.error(
              'Model deployment failed',
              lastFailureReason ||
                'Failed to load the model. Please check the model configuration and try again.',
              [
                {
                  title: 'View deployment',
                  onClick: () => navigate(`/ai-hub/deployments/${namespace}`),
                },
              ],
            );
            return { status: NotificationResponseStatus.STOP };
          }

          if (isRunning && lastState === ModelDeploymentState.LOADED) {
            // Model is running, stop polling
            return { status: NotificationResponseStatus.STOP };
          }

          if (isStopped) {
            // Model is stopped, stop polling
            return { status: NotificationResponseStatus.STOP };
          }

          if (
            isStarting ||
            inferenceServiceModelState === ModelDeploymentState.PENDING ||
            inferenceServiceModelState === ModelDeploymentState.LOADING
          ) {
            // Model is still starting/loading, continue polling
            return { status: NotificationResponseStatus.REPOLL };
          }

          // For any other state, stop polling
          return { status: NotificationResponseStatus.STOP };
        } catch (error: unknown) {
          // If we can't fetch the inference service, it was probably deleted
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('404') || errorMessage.includes('not found')) {
            // Model was deleted, stop polling
            return { status: NotificationResponseStatus.STOP };
          }

          notification.error('Error checking model deployment', errorMessage);
          return {
            status: NotificationResponseStatus.STOP,
          };
        }
      },
    });
  }, [
    registerNotification,
    modelStatus?.failedToSchedule,
    navigate,
    namespace,
    modelName,
    notification,
  ]);

  return { watchDeployment };
};
