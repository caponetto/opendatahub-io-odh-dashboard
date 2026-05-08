import axios from '@odh-dashboard/dashboard-foundation-frontend/utilities/axios';
import { ConfigMap, Secret } from '@odh-dashboard/dashboard-foundation-frontend/types';

export const getEnvSecret = (namespace: string, name: string): Promise<Secret> => {
  const url = `/api/envs/secret/${namespace}/${name}`;
  return axios.get(url).then((response) => response.data);
};

export const getEnvConfigMap = (namespace: string, name: string): Promise<ConfigMap> => {
  const url = `/api/envs/configmap/${namespace}/${name}`;
  return axios.get(url).then((response) => response.data);
};
