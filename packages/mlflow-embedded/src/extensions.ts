import type {
  AreaExtension,
  HrefNavItemExtension,
  RouteExtension,
  TaskItemExtension,
} from '@odh-dashboard/plugin-core/extension-points';
import type { PipelinesMlflowIntegrationExtension } from '@odh-dashboard/pipelines-shared/concepts/pipelines/extension-points';
// eslint-disable-next-line no-restricted-syntax
import { SupportedArea } from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
// eslint-disable-next-line no-restricted-syntax
import { globPromptManagementAll, promptManagementPath } from '#~/routes';
// eslint-disable-next-line no-restricted-syntax
import { PROMPT_MANAGEMENT_PAGE_TITLE } from '../shared/const';

/**
 * MLflow host-side extensions.
 */
const extensions: (
  | AreaExtension
  | HrefNavItemExtension
  | RouteExtension
  | TaskItemExtension
  | PipelinesMlflowIntegrationExtension
)[] = [
  {
    type: 'app.area',
    properties: {
      id: 'mlflow-embedded',
    },
  },
  {
    type: 'app.navigation/href',
    flags: {
      required: [SupportedArea.MLFLOW],
    },
    properties: {
      id: 'experiments-mlflow',
      title: 'Experiments (MLflow)',
      href: '/develop-train/mlflow/experiments',
      section: 'develop-and-train',
      path: '/develop-train/mlflow/experiments/*',
    },
  },
  {
    type: 'app.route',
    flags: {
      required: [SupportedArea.MLFLOW],
    },
    properties: {
      path: '/develop-train/mlflow/*',
      component: () => import('../experiments/GlobalMLflowExperimentsRoutes'),
    },
  },
  {
    type: 'app.navigation/href',
    flags: {
      required: ['plugin-gen-ai', SupportedArea.MLFLOW],
    },
    properties: {
      id: 'prompt-management',
      title: PROMPT_MANAGEMENT_PAGE_TITLE,
      href: promptManagementPath,
      section: 'gen-ai-studio',
      path: globPromptManagementAll,
      group: '6_prompt_management',
    },
  },
  {
    type: 'app.route',
    flags: {
      required: [SupportedArea.MLFLOW],
    },
    properties: {
      path: globPromptManagementAll,
      component: () => import('../prompts/GlobalMLflowPromptManagementRoutes'),
    },
  },
  {
    type: 'app.task/item',
    flags: {
      required: [SupportedArea.MLFLOW],
    },
    properties: {
      id: 'develop-experiments',
      group: 'develop-and-train',
      title: 'Track and compare training runs',
      destination: { href: '/develop-train/mlflow/experiments' },
      order: '3_experiments',
    },
  },
  {
    type: 'app.task/item',
    flags: {
      required: ['plugin-gen-ai', SupportedArea.MLFLOW],
    },
    properties: {
      id: 'genai-prompts',
      group: 'gen-ai-studio',
      title: 'Create and manage AI prompts',
      destination: { href: promptManagementPath },
      order: '4_prompts',
    },
  },
  {
    type: 'pipelines.mlflow-integration',
    flags: {
      required: [SupportedArea.MLFLOW],
    },
    properties: {
      useMlflowExperiments: () =>
        import('@odh-dashboard/mlflow-shared/concepts/mlflow/hooks/useMlflowExperiments').then(
          (m) => m.default,
        ),
      MlflowExperimentSelector: () =>
        import('@odh-dashboard/mlflow-shared/concepts/mlflow/MlflowExperimentSelector').then(
          (m) => m.default,
        ),
      useIsMlflowCRAvailable: () =>
        import('./concepts/hooks/useIsMlflowCRAvailable').then((m) => m.default),
    },
  },
];

export default extensions;
