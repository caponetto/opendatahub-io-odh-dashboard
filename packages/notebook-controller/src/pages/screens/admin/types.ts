import { Notebook, UsernameMap } from '@odh-dashboard/dashboard-foundation-frontend/types';
import type { PrivilegeState } from '@odh-dashboard/dashboard-foundation-frontend/types/allowedUser';

export type UsernamePrivilegeMap = UsernameMap<PrivilegeState>;

export type AdminViewUserData = {
  name: string;
  privilege: PrivilegeState;
  lastActivity?: string;
  serverStatus: ServerStatus;
  actions: ServerStatus;
};

export type ServerStatus = {
  notebook: Notebook | null;
  isNotebookRunning: boolean;
  forceRefresh: () => void;
};

/**
 * Types `content` to the desired type if the 2nd param is true.
 */
export const isField = <T extends AdminViewUserData[keyof AdminViewUserData]>(
  content: unknown,
  isFieldFlag: boolean,
): content is T => isFieldFlag;
