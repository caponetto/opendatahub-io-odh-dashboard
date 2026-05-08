import type { Extension } from '@odh-dashboard/plugin-core';

const createRedirectComponent = (args: { from: string; to: string }) => () =>
  import('@odh-dashboard/dashboard-foundation-frontend/utilities/v2Redirect').then((module) => ({
    default: () => module.buildV2RedirectElement(args),
  }));

const extensions: Extension[] = [
  {
    type: 'app.navigation/href',
    properties: {
      id: 'apps-explore',
      title: 'Explore',
      href: '/applications/explore',
      section: 'applications',
    },
  },

  {
    type: 'app.route',
    properties: {
      path: '/applications/explore',
      component: () => import('./pages/exploreApplication/ExploreApplications'),
    },
  },
  {
    type: 'app.route',
    properties: {
      path: '/explore',
      component: createRedirectComponent({ from: '/explore', to: '/applications/explore' }),
    },
  },
];

export default extensions;
