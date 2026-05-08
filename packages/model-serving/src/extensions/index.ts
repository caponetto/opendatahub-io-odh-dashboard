import type { Extension } from '@odh-dashboard/plugin-core';
// eslint-disable-next-line no-restricted-syntax
import { SupportedArea } from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import type { ModelServingMetricsRoutesExtension } from '@odh-dashboard/model-serving-shared/extension-points';
import odhExtensions from './odh';
import modelRegistryExtensions from './model-registry';
import modelCatalogExtensions from './model-catalog';

const extensions: (Extension | ModelServingMetricsRoutesExtension)[] = [
  ...odhExtensions,
  ...modelRegistryExtensions,
  ...modelCatalogExtensions,
  {
    type: 'workbench.model-serving-integration',
    flags: {
      required: [SupportedArea.MODEL_SERVING],
    },
    properties: {
      ModelServingContextProvider: () =>
        import('../pages/ModelServingContext').then((m) => m.default),
      DeployedModelsSectionComposite: () =>
        import('../concepts/workbenchIntegration/DeployedModelsSectionComposite').then(
          (m) => m.default,
        ),
      ProjectMetricsRoutesComposite: () =>
        import('../concepts/workbenchIntegration/ProjectMetricsRoutesComposite').then(
          (m) => m.default,
        ),
    },
  },
  {
    type: 'model-serving.metrics/routes',
    properties: {
      Component: () => import('../pages/screens/projects/ProjectMetricsRoutes'),
    },
  },
];

export default extensions;
