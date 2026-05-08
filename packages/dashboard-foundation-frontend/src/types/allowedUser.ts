export enum PrivilegeState {
  ADMIN = 'Admin',
  USER = 'User',
}

export type AllowedUser = {
  username: string;
  privilege: PrivilegeState;
  lastActivity: string;
};
