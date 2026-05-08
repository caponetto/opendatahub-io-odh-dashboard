import { getConsoleLinks } from '@odh-dashboard/dashboard-foundation-backend/resourceUtils';
import { ConsoleLinkKind } from '@odh-dashboard/dashboard-foundation-backend/backendTypes';

export const listConsoleLinks = async (): Promise<ConsoleLinkKind[]> =>
  Promise.resolve(getConsoleLinks());
