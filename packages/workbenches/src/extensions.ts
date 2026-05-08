import type { Extension } from '@odh-dashboard/plugin-core';
// eslint-disable-next-line no-restricted-syntax
import { SupportedArea } from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';

const extensions: Extension[] = [
  {
    type: 'app.navigation/href',
    flags: {
      required: [SupportedArea.DS_PROJECTS_VIEW],
    },
    properties: {
      id: 'projects',
      title: 'Projects',
      href: '/projects',
      path: '/projects/*',
      group: '2_projects',
      iconRef: () =>
        import('@odh-dashboard/dashboard-foundation-frontend/images/icons/ProjectsNavIcon'),
    },
  },

  {
    type: 'app.route',
    properties: {
      path: '/projects/*',
      component: () => import('./pages/ProjectViewRoutes'),
    },
  },
];

export default extensions;
