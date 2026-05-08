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
      id: 'develop-and-train',
      title: 'Develop & train',
      group: '5_develop_and_train',
      iconRef: () =>
        import('@odh-dashboard/dashboard-foundation-frontend/images/icons/DevelopAndTrainNavIcon'),
    },
  },
  {
    type: 'app.navigation/section',
    properties: {
      id: 'pipelines',
      title: 'Pipelines',
      group: '2_pipelines',
      section: 'develop-and-train',
    },
  },
  {
    type: 'app.navigation/href',
    flags: {
      required: [SupportedArea.DS_PIPELINES],
    },
    properties: {
      id: 'pipeline-definitions',
      title: 'Pipeline definitions',
      href: '/develop-train/pipelines/definitions',
      section: 'pipelines',
      path: '/develop-train/pipelines/definitions/*',
    },
  },
  {
    type: 'app.navigation/href',
    flags: {
      required: [SupportedArea.DS_PIPELINES],
    },
    properties: {
      id: 'runs',
      title: 'Runs',
      href: '/develop-train/pipelines/runs',
      section: 'pipelines',
      path: '/develop-train/pipelines/runs/*',
    },
  },
  {
    type: 'app.navigation/href',
    flags: {
      required: [SupportedArea.DS_PIPELINES],
    },
    properties: {
      id: 'artifacts',
      title: 'Artifacts',
      href: '/develop-train/pipelines/artifacts',
      section: 'pipelines',
      path: '/develop-train/pipelines/artifacts/*',
    },
  },
  {
    type: 'app.navigation/href',
    flags: {
      required: [SupportedArea.DS_PIPELINES],
    },
    properties: {
      id: 'executions',
      title: 'Executions',
      href: '/develop-train/pipelines/executions',
      section: 'pipelines',
      path: '/develop-train/pipelines/executions/*',
    },
  },

  {
    type: 'app.route',
    properties: {
      path: '/develop-train/pipelines/definitions/*',
      component: () => import('./pages/pipelines/GlobalPipelinesRoutes'),
    },
  },
  {
    type: 'app.route',
    properties: {
      path: '/pipelines/*',
      component: createRedirectComponent({
        from: '/pipelines/*',
        to: '/develop-train/pipelines/definitions/*',
      }),
    },
  },
  {
    type: 'app.route',
    properties: {
      path: '/develop-train/pipelines/runs/*',
      component: () => import('./pages/pipelines/GlobalPipelineRunsRoutes'),
    },
  },
  {
    type: 'app.route',
    properties: {
      path: '/pipelineRuns/*',
      component: createRedirectComponent({
        from: '/pipelineRuns/*',
        to: '/develop-train/pipelines/runs/*',
      }),
    },
  },
  {
    type: 'app.route',
    properties: {
      path: '/develop-train/experiments/*',
      component: () => import('./pages/pipelines/GlobalPipelineExperimentsRoutes'),
    },
  },
  {
    type: 'app.route',
    properties: {
      path: '/experiments/*',
      component: createRedirectComponent({
        from: '/experiments/*',
        to: '/develop-train/experiments/*',
      }),
    },
  },
  {
    type: 'app.route',
    properties: {
      path: '/develop-train/pipelines/artifacts/*',
      component: () => import('./pages/pipelines/GlobalArtifactsRoutes'),
    },
  },
  {
    type: 'app.route',
    properties: {
      path: '/artifacts/*',
      component: createRedirectComponent({
        from: '/artifacts/*',
        to: '/develop-train/pipelines/artifacts/*',
      }),
    },
  },
  {
    type: 'app.route',
    properties: {
      path: '/develop-train/pipelines/executions/*',
      component: () => import('./pages/pipelines/GlobalPipelineExecutionsRoutes'),
    },
  },
  {
    type: 'app.route',
    properties: {
      path: '/executions/*',
      component: createRedirectComponent({
        from: '/executions/*',
        to: '/develop-train/pipelines/executions/*',
      }),
    },
  },
  {
    type: 'app.route',
    flags: {
      required: [SupportedArea.FINE_TUNING],
    },
    properties: {
      path: '/ai-hub/model-customization/*',
      component: () => import('./pages/pipelines/GlobalModelCustomizationRoutes'),
    },
  },
  {
    type: 'app.route',
    flags: {
      required: [SupportedArea.FINE_TUNING],
    },
    properties: {
      path: '/modelCustomization/*',
      component: createRedirectComponent({
        from: '/modelCustomization/*',
        to: '/ai-hub/model-customization/*',
      }),
    },
  },
  {
    type: 'app.context-provider',
    flags: {
      required: [SupportedArea.DS_PIPELINES],
    },
    properties: {
      id: 'invalid-argo-deployment-alert',
      provider: () =>
        import('./concepts/content/InvalidArgoDeploymentAlert').then(
          (m) => m.InvalidArgoAlertProvider,
        ),
    },
  },
  {
    type: 'app.external-redirect',
    properties: {
      path: '/pipelinesSdk/:namespace/*',
      component: () => import('./pages/external/PipelinesSdkRedirects'),
    },
  },
  {
    type: 'app.external-redirect',
    properties: {
      path: '/elyra/:namespace/*',
      component: () => import('./pages/external/ElyraRedirects'),
    },
  },
  {
    type: 'workbench.pipelines-integration',
    flags: {
      required: [SupportedArea.DS_PIPELINES],
    },
    properties: {
      PipelineContextProvider: () =>
        import('./concepts/context').then((m) => m.PipelineContextProvider),
      PipelinesSection: () =>
        import('./concepts/workbenchIntegration/PipelinesSectionComposite').then((m) => m.default),
      PipelinesOverviewCard: () =>
        import('./concepts/workbenchIntegration/PipelinesOverviewCardComposite').then(
          (m) => m.default,
        ),
      CanEnableElyraPipelinesCheck: () =>
        import('./concepts/elyra/CanEnableElyraPipelinesCheck').then((m) => m.default),
      ElyraInvalidVersionAlerts: () =>
        import('./concepts/elyra/ElyraInvalidVersionAlerts').then(
          (m) => m.ElyraInvalidVersionAlerts,
        ),
    },
  },
];

export default extensions;
