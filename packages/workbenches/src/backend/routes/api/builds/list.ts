import { getBuildStatuses } from '@odh-dashboard/dashboard-foundation-backend/resourceUtils';
import { BuildStatus } from '@odh-dashboard/dashboard-foundation-backend/backendTypes';

export const listBuilds = async (): Promise<BuildStatus[]> => getBuildStatuses();
