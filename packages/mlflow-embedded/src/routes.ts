/**
 * MLflow route constants and helpers.
 *
 * Route hierarchy:
 *   /develop-train/mlflow — redirects to experiments
 *   /develop-train/mlflow/experiments — Experiments list / detail
 *   /gen-ai-studio/prompts — Prompt management
 */

import { mlflowRootPath } from '@odh-dashboard/mlflow-shared/concepts/mlflow/routes';

export const globMlflowAll = `${mlflowRootPath}/*`;

export const MLFLOW_PROXY_BASE_PATH = '/mlflow';

export const promptManagementPath = '/gen-ai-studio/prompts';
export const globPromptManagementAll = `${promptManagementPath}/*`;

export const mlflowPromptManagementBaseRoute = (namespace?: string): string => {
  if (!namespace) {
    return promptManagementPath;
  }
  return `${promptManagementPath}?workspace=${encodeURIComponent(namespace)}`;
};
