import type { Extension } from '@odh-dashboard/plugin-core';
// eslint-disable-next-line no-restricted-syntax
import { SupportedArea } from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';

const createRedirectComponent = (args: { from: string; to: string }) => () =>
  import('@odh-dashboard/dashboard-foundation-frontend/utilities/v2Redirect').then((module) => ({
    default: () => module.buildV2RedirectElement(args),
  }));

const extensions: Extension[] = [
  {
    type: 'app.navigation/href',
    flags: {
      required: [SupportedArea.HOME],
    },
    properties: {
      id: 'home',
      title: 'Home',
      href: '/',
      group: '1_home',
      iconRef: () =>
        import('@odh-dashboard/dashboard-foundation-frontend/images/icons/HomeNavIcon'),
    },
  },

  {
    type: 'app.navigation/section',
    properties: {
      id: 'applications',
      title: 'Applications',
      group: '8_other',
      iconRef: () =>
        import('@odh-dashboard/dashboard-foundation-frontend/images/icons/ApplicationsNavIcon'),
    },
  },
  {
    type: 'app.navigation/href',
    flags: {
      required: [SupportedArea.HOME],
    },
    properties: {
      id: 'apps-installed',
      title: 'Enabled',
      href: '/applications/enabled',
      section: 'applications',
    },
  },
  {
    type: 'app.navigation/href',
    flags: {
      disallowed: [SupportedArea.HOME],
    },
    properties: {
      id: 'apps-installed',
      title: 'Enabled',
      href: '/',
      section: 'applications',
    },
  },

  {
    type: 'app.route',
    flags: {
      required: [SupportedArea.HOME],
    },
    properties: {
      component: () => import('./pages/home/Home'),
      path: '/',
    },
  },
  {
    type: 'app.route',
    flags: {
      required: [SupportedArea.HOME],
    },
    properties: {
      path: '/applications/enabled',
      component: () => import('./pages/enabledApplications/EnabledApplications'),
    },
  },
  {
    type: 'app.route',
    flags: {
      required: [SupportedArea.HOME],
    },
    properties: {
      path: '/enabled',
      component: createRedirectComponent({ from: '/enabled', to: '/applications/enabled' }),
    },
  },
  {
    type: 'app.route',
    flags: {
      disallowed: [SupportedArea.HOME],
    },
    properties: {
      path: '/',
      component: () => import('./pages/enabledApplications/EnabledApplications'),
    },
  },
];

export default extensions;
