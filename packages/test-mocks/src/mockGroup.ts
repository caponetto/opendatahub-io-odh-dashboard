import { GroupKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';

type MockGroupType = {
  name?: string;
};
export const mockGroup = ({ name = 'odh-admins' }: MockGroupType): GroupKind => ({
  metadata: {
    name,
  },
  users: [],
  apiVersion: 'user.openshift.io/v1',
  kind: 'Group',
});
