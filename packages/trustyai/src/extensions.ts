import type { ProjectSettingsCard } from '@odh-dashboard/plugin-core/extension-points';
import type { ModelServingBiasIntegrationExtension } from '@odh-dashboard/model-serving-shared/extension-points';
// eslint-disable-next-line no-restricted-syntax
import { SupportedArea } from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';

const extensions: (ProjectSettingsCard | ModelServingBiasIntegrationExtension)[] = [
  {
    type: 'app.project-details/settings-card',
    flags: {
      required: [SupportedArea.TRUSTY_AI],
    },
    properties: {
      id: 'model-bias',
      component: () => import('./concepts/content/ModelBiasSettingsCard'),
    },
  },
  {
    type: 'model-serving.metrics/bias-integration',
    flags: {
      required: [SupportedArea.TRUSTY_AI],
    },
    properties: {
      ContextProvider: () =>
        import('./concepts/context/TrustyAIContext').then((m) => m.TrustyAIContextProvider),
      useModelBiasData: () =>
        import('./concepts/context/useModelBiasData').then((m) => m.useModelBiasData),
      useIsBiasAvailable: () =>
        import('./concepts/context/useDoesTrustyAICRExist').then((m) => {
          const hook = m.default;
          return () => {
            const [isAvailable] = hook();
            return isAvailable;
          };
        }),
    },
  },
];

export default extensions;
