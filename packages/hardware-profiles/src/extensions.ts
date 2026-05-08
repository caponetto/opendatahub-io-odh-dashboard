import type { Extension } from '@odh-dashboard/plugin-core';
import type {
  RouteExtension,
  StatusProviderExtension,
} from '@odh-dashboard/plugin-core/extension-points';

const createRedirectComponent = (args: { from: string; to: string }) => () =>
  import('@odh-dashboard/dashboard-foundation-frontend/utilities/v2Redirect').then((module) => ({
    default: () => module.buildV2RedirectElement(args),
  }));

const extensions: (RouteExtension | StatusProviderExtension | Extension)[] = [
  {
    type: 'app.navigation/href',
    properties: {
      id: 'settings-hardware-profiles',
      title: 'Hardware profiles',
      href: '/settings/environment-setup/hardware-profiles',
      section: 'settings-environment-setup',
      path: '/settings/environment-setup/hardware-profiles/*',
      statusProviderId: 'hardware-profiles.status',
      accessReview: {
        group: 'infrastructure.opendatahub.io',
        resource: 'hardwareprofiles',
        verb: 'create',
      },
    },
  },
  {
    type: 'app.route',
    properties: {
      path: '/settings/environment-setup/hardware-profiles/*',
      component: () => import('./pages/hardwareProfiles/HardwareProfilesRoutes'),
    },
  },
  {
    type: 'app.route',
    properties: {
      path: '/hardwareProfiles/*',
      component: createRedirectComponent({
        from: '/hardwareProfiles/*',
        to: '/settings/environment-setup/hardware-profiles/*',
      }),
    },
  },
  {
    type: 'app.status-provider',
    properties: {
      id: 'hardware-profiles.status',
      statusProviderHook: () =>
        import('./concepts/useHardwareProfilesStatusProvider').then(
          (m) => m.useHardwareProfilesStatusProvider,
        ),
    },
  },
  {
    type: 'app.context-provider',
    properties: {
      id: 'hardware-profiles',
      provider: () =>
        import(
          '@odh-dashboard/hardware-profiles-shared/concepts/hardwareProfiles/HardwareProfilesContext'
        ).then((m) => m.HardwareProfilesContextProvider),
    },
  },
];

export default extensions;
