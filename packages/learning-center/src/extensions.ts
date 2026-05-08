import type { Extension } from '@odh-dashboard/plugin-core';

const createRedirectComponent = (args: { from: string; to: string }) => () =>
  import('@odh-dashboard/dashboard-foundation-frontend/utilities/v2Redirect').then((module) => ({
    default: () => module.buildV2RedirectElement(args),
  }));

const extensions: Extension[] = [
  {
    type: 'app.navigation/href',
    properties: {
      id: 'learning-resources',
      title: 'Learning resources',
      href: '/learning-resources',
      group: '7_other',
      iconRef: () =>
        import(
          '@odh-dashboard/dashboard-foundation-frontend/images/icons/LearningResourcesNavIcon'
        ),
    },
  },

  {
    type: 'app.route',
    properties: {
      path: '/learning-resources',
      component: () => import('./pages/learningCenter/LearningCenter'),
    },
  },
  {
    type: 'app.route',
    properties: {
      path: '/resources',
      component: createRedirectComponent({ from: '/resources', to: '/learning-resources' }),
    },
  },
];

export default extensions;
