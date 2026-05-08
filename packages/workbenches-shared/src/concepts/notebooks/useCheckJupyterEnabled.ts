import { useAppContext } from '@odh-dashboard/dashboard-foundation-frontend/app/AppContext';

export const useCheckJupyterEnabled = (): boolean => {
  const { dashboardConfig } = useAppContext();
  return dashboardConfig.spec.notebookController?.enabled !== false;
};
