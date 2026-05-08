import {
  ConfigSecretItem,
  ListConfigSecretsResponse,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';

type MockConfigMapsSecretsType = {
  secrets?: ConfigSecretItem[];
  configMaps?: ConfigSecretItem[];
};

export const mockConfigMapsSecrets = ({
  configMaps = [{ name: 'foo-bar', keys: ['bar.crt'] }],
  secrets = [{ name: 'foo', keys: ['foo.crt', 'bar.crt'] }],
}: MockConfigMapsSecretsType): ListConfigSecretsResponse => ({
  secrets,
  configMaps,
});
