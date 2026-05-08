// eslint-disable-next-line no-restricted-syntax
import { SupportedArea } from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import type { Extension } from '@odh-dashboard/plugin-core';

const extensions: Extension[] = [
  {
    type: 'model-catalog.deployment/navigate-wizard',
    properties: {
      useAvailablePlatformIds: () =>
        import('../modelRegistry/useAvailablePlatformIds').then((m) => m.default),
      useNavigateToDeploymentWizardWithData: () =>
        import('../modelRegistry/useNavigateToDeploymentWizardWithData').then(
          (m) => m.useNavigateToDeploymentWizardWithData,
        ),
    },
    flags: {
      required: [SupportedArea.MODEL_SERVING],
    },
  },
];

export default extensions;
