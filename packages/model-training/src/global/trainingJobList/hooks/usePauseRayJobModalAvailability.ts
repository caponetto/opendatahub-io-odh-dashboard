import { useBrowserStorage } from '@odh-dashboard/dashboard-foundation-frontend/components/browserStorage/BrowserStorageContext';

const usePauseRayJobModalAvailability = (): [boolean, (v: boolean) => void] =>
  useBrowserStorage<boolean>('odh.dashboard.model-training.pause-ray-job.modal.preference', false);

export default usePauseRayJobModalAvailability;
