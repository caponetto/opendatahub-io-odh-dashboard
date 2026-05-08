import { useBrowserStorage } from '@odh-dashboard/dashboard-foundation-frontend/components/browserStorage/BrowserStorageContext';

const usePauseTrainingJobModalAvailability = (): [boolean, (v: boolean) => void] =>
  useBrowserStorage<boolean>('odh.dashboard.model-training.pause.modal.preference', false);

export default usePauseTrainingJobModalAvailability;
