import * as React from 'react';
import { getSecret } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/secrets';
import useFetchState, {
  FetchState,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetchState';
import {
  EnvVariable,
  EnvironmentVariableType,
  SecretCategory,
} from '#~/concepts/workbench/envVariableFormTypes';

const useNamespaceSecret = (
  namespace: string,
  secretName: string,
): FetchState<EnvVariable | undefined> => {
  const fetchSecret = React.useCallback<() => Promise<EnvVariable | undefined>>(
    () =>
      getSecret(namespace, secretName).then((secret) => {
        if (!secret.data) {
          throw new Error(`Secret ${secretName} data was not found.`);
        }

        const { data } = secret;

        return {
          type: EnvironmentVariableType.SECRET,
          existingName: secret.metadata.name,
          values: {
            category: SecretCategory.GENERIC,
            data: Object.keys(data).map((key) => ({ key, value: atob(data[key]) })),
          },
        };
      }),
    [namespace, secretName],
  );
  return useFetchState<EnvVariable | undefined>(fetchSecret, undefined);
};

export default useNamespaceSecret;
