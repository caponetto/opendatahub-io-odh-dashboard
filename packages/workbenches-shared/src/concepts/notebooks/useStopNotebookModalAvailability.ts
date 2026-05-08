import { useBrowserStorage } from '@odh-dashboard/dashboard-foundation-frontend/components/browserStorage/BrowserStorageContext';

const useStopNotebookModalAvailability = (): [boolean, (v: boolean) => void] =>
  useBrowserStorage<boolean>('odh.dashboard.dsg.stop.modal.preference', false);

export default useStopNotebookModalAvailability;
