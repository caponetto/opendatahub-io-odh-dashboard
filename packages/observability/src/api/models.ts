import { K8sModelCommon } from '@odh-dashboard/k8s-browser';

export const ClusterVersionModel: K8sModelCommon = {
  apiVersion: 'v1',
  apiGroup: 'config.openshift.io',
  kind: 'ClusterVersion',
  plural: 'clusterversions',
};

export const InfrastructureModel: K8sModelCommon = {
  apiVersion: 'v1',
  apiGroup: 'config.openshift.io',
  kind: 'Infrastructure',
  plural: 'infrastructures',
};
