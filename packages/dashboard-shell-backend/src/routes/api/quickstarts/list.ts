import { QuickStart } from '@odh-dashboard/dashboard-foundation-backend/backendTypes';
import {
  getQuickStarts,
  checkJupyterEnabled,
} from '@odh-dashboard/dashboard-foundation-backend/resourceUtils';

export const listQuickStarts = (): Promise<QuickStart[]> =>
  Promise.resolve(
    getQuickStarts().filter((qs) => checkJupyterEnabled() || qs.spec.appName !== 'jupyter'),
  );
