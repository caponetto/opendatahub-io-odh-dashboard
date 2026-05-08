import { AuthKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';

type MockAuthData = {
  adminGroups?: string[];
  allowedGroups?: string[];
};

export const mockAuth = ({
  adminGroups = ['odh-admins'],
  allowedGroups = ['system:authenticated'],
}: MockAuthData = {}): AuthKind => ({
  apiVersion: 'services.platform.opendatahub.io/v1alpha1',
  kind: 'Auth',
  metadata: {
    name: 'auth',
  },
  spec: {
    adminGroups,
    allowedGroups,
  },
});
