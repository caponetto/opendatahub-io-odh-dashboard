import type { Extension } from '@odh-dashboard/plugin-core';
// eslint-disable-next-line no-restricted-syntax
import { SupportedArea } from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';

const createRedirectComponent = (args: { from: string; to: string }) => () =>
  import('@odh-dashboard/dashboard-foundation-frontend/utilities/v2Redirect').then((module) => ({
    default: () => module.buildV2RedirectElement(args),
  }));

const extensions: Extension[] = [
  {
    type: 'app.navigation/section',
    properties: {
      id: 'observe-and-monitor',
      title: 'Observe & monitor',
      group: '6_observe_and_monitor',
      iconRef: () =>
        import(
          '@odh-dashboard/dashboard-foundation-frontend/images/icons/ObserveAndMonitorNavIcon'
        ),
    },
  },
  {
    type: 'app.navigation/href',
    flags: {
      required: [SupportedArea.DISTRIBUTED_WORKLOADS],
    },
    properties: {
      id: 'workloadMetrics',
      title: 'Workload metrics',
      href: '/observe-monitor/workload-metrics',
      path: '/observe-monitor/workload-metrics/*',
      section: 'observe-and-monitor',
    },
  },

  {
    type: 'app.route',
    properties: {
      path: '/observe-monitor/workload-metrics/*',
      component: () => import('./pages/distributedWorkloads/GlobalDistributedWorkloadsRoutes'),
    },
  },
  {
    type: 'app.route',
    properties: {
      path: '/distributedWorkloads/*',
      component: createRedirectComponent({
        from: '/distributedWorkloads/*',
        to: '/observe-monitor/workload-metrics/*',
      }),
    },
  },
];

export default extensions;
