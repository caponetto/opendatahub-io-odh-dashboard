import type { Extension } from '@odh-dashboard/plugin-core';
// eslint-disable-next-line no-restricted-syntax
import { SupportedArea } from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';

const createRedirectComponent = (args: { from: string; to: string }) => () =>
  import('@odh-dashboard/dashboard-foundation-frontend/utilities/v2Redirect').then((module) => ({
    default: () => module.buildV2RedirectElement(args),
  }));

/** @deprecated Migrate to RBAC. See ADMIN_USER in @odh-dashboard/plugin-core */
const ADMIN_USER = 'ADMIN_USER';

const extensions: Extension[] = [
  {
    type: 'app.navigation/section',
    properties: {
      id: 'cluster-settings',
      title: 'Cluster settings',
      group: '1_cluster_settings',
      section: 'settings',
    },
  },
  {
    type: 'app.navigation/href',
    flags: {
      required: [SupportedArea.CLUSTER_SETTINGS, ADMIN_USER],
    },
    properties: {
      id: 'settings-general-cluster-settings',
      title: 'General settings',
      href: '/settings/cluster/general',
      section: 'cluster-settings',
    },
  },
  {
    type: 'app.route',
    flags: {
      required: [ADMIN_USER],
    },
    properties: {
      path: '/settings/cluster/general',
      component: () => import('./pages/clusterSettings/ClusterSettings'),
    },
  },
  {
    type: 'app.route',
    flags: {
      required: [ADMIN_USER],
    },
    properties: {
      path: '/clusterSettings',
      component: createRedirectComponent({
        from: '/clusterSettings',
        to: '/settings/cluster/general',
      }),
    },
  },
];

export default extensions;
