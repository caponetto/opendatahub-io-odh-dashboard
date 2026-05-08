import type { Extension } from '@odh-dashboard/plugin-core';
import type { RouteExtension } from '@odh-dashboard/plugin-core/extension-points';
// eslint-disable-next-line no-restricted-syntax
import { SupportedArea } from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';

const createRedirectComponent = (args: { from: string; to: string }) => () =>
  import('@odh-dashboard/dashboard-foundation-frontend/utilities/v2Redirect').then((module) => ({
    default: () => module.buildV2RedirectElement(args),
  }));

/** @deprecated Migrate to RBAC. See ADMIN_USER in @odh-dashboard/plugin-core */
const ADMIN_USER = 'ADMIN_USER';

const extensions: (RouteExtension | Extension)[] = [
  {
    type: 'app.navigation/href',
    flags: {
      required: [SupportedArea.STORAGE_CLASSES, ADMIN_USER],
    },
    properties: {
      id: 'settings-storage-classes',
      title: 'Storage classes',
      href: '/settings/cluster/storage-classes',
      section: 'cluster-settings',
      path: '/settings/cluster/storage-classes/*',
    },
  },
  {
    type: 'app.route',
    flags: {
      required: [ADMIN_USER],
    },
    properties: {
      path: '/settings/cluster/storage-classes/*',
      component: () => import('./pages/StorageClassesPage'),
    },
  },
  {
    type: 'app.route',
    flags: {
      required: [ADMIN_USER],
    },
    properties: {
      path: '/storageClasses/*',
      component: createRedirectComponent({
        from: '/storageClasses/*',
        to: '/settings/cluster/storage-classes/*',
      }),
    },
  },
];

export default extensions;
