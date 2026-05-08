import type { NavExtension } from '@odh-dashboard/plugin-core/extension-points';

const extensions: NavExtension[] = [
  {
    type: 'app.navigation/section',
    properties: {
      id: 'settings',
      title: 'Settings',
      group: '8_settings',
      iconRef: () =>
        import('@odh-dashboard/dashboard-foundation-frontend/images/icons/SettingsNavIcon'),
    },
  },
];

export default extensions;
