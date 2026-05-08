import axios from '@odh-dashboard/dashboard-foundation-frontend/utilities/axios';
import { STATUS_ENDPOINT } from '@odh-dashboard/mlflow-shared/concepts/mlflow/const';
import { POLL_INTERVAL } from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import { createSharedPollingStore } from '@odh-dashboard/dashboard-foundation-frontend/utilities/createSharedPollingStore';

export type MLflowStatus = {
  configured: boolean;
  loaded: boolean;
};

let lastPollErrored = false;

const TEARDOWN_GRACE_MS = 1000;

export const useMLflowStatus = createSharedPollingStore<MLflowStatus>({
  fetchFn: async () => {
    const response = await axios.get<{ configured: boolean }>(STATUS_ENDPOINT);
    if (lastPollErrored) {
      lastPollErrored = false;
      // eslint-disable-next-line no-console
      console.info('MLflow BFF status check recovered');
    }
    return { configured: Boolean(response.data.configured), loaded: true };
  },
  initialValue: { configured: false, loaded: false },
  disabledValue: { configured: false, loaded: true },
  pollInterval: POLL_INTERVAL,
  teardownGracePeriod: TEARDOWN_GRACE_MS,
  onError: (e, previous) => {
    if (!lastPollErrored) {
      lastPollErrored = true;
      // eslint-disable-next-line no-console
      console.warn('MLflow BFF status check failed (will suppress until recovery)', e);
    }
    return previous;
  },
  onReset: () => {
    lastPollErrored = false;
  },
});
