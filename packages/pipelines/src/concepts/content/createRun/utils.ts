import { convertToDate } from '@odh-dashboard/dashboard-foundation-frontend/utilities/time';
import type { RunDateTime } from '@odh-dashboard/dashboard-foundation-frontend/utilities/pipelinePeriodicSchedule';
import {
  MlflowExperimentMode,
  MlflowFormData,
  RunFormData,
  RunTypeOption,
  SafeRunFormData,
  ScheduledType,
} from '@odh-dashboard/pipelines/concepts/content/createRun/types';
import { ParametersKF, PipelineVersionKF } from '@odh-dashboard/pipelines/concepts/kfTypes';
import { getCorePipelineSpec } from '@odh-dashboard/pipelines/concepts/getCorePipelineSpec';
import { isArgoWorkflow } from '@odh-dashboard/pipelines/concepts/content/tables/utils';

export const getMlflowExperimentName = (mlflow: MlflowFormData): string | undefined => {
  if (!mlflow.isExperimentTrackingEnabled) {
    return undefined;
  }

  const raw =
    mlflow.mode === MlflowExperimentMode.NEW
      ? mlflow.newExperimentName
      : mlflow.existingExperimentName;
  return raw.trim() || undefined;
};

export const getDefaultMlflowFormData = (): MlflowFormData => ({
  isExperimentTrackingEnabled: true,
  mode: MlflowExperimentMode.EXISTING,
  existingExperimentName: '',
});

const runTypeSafeData = (runType: RunFormData['runType']): boolean =>
  runType.type !== RunTypeOption.SCHEDULED ||
  runType.data.triggerType !== ScheduledType.CRON ||
  !!runType.data.value;

export const isStartBeforeEnd = (start?: RunDateTime, end?: RunDateTime): boolean => {
  if (!start || !end) {
    return true;
  }
  const startDate = convertToDate(start);
  const endDate = convertToDate(end);
  return endDate.getTime() - startDate.getTime() > 0;
};

const isValidDate = (value?: RunDateTime): boolean => {
  if (!value) {
    return true;
  }
  const date = convertToDate(value);
  return date.toString() !== 'Invalid Date';
};

const runTypeSafeDates = (runType: RunFormData['runType']): boolean =>
  runType.type !== RunTypeOption.SCHEDULED ||
  (isValidDate(runType.data.start) &&
    isValidDate(runType.data.end) &&
    isStartBeforeEnd(runType.data.start, runType.data.end));

export const isFilledRunFormData = (
  formData: RunFormData,
  isMlflowAvailable: boolean,
): formData is SafeRunFormData => {
  const mlflowExperimentName = getMlflowExperimentName(formData.mlflow);
  const hasMlflowExperimentName =
    !isMlflowAvailable || !formData.mlflow.isExperimentTrackingEnabled || !!mlflowExperimentName;

  const inputDefinitionParams = getInputDefinitionParams(formData.version);
  const hasRequiredInputParams = Object.entries(formData.params || {}).every(
    ([paramKey, paramValue]) =>
      inputDefinitionParams?.[paramKey]?.isOptional ||
      (paramValue !== undefined && paramValue !== ''),
  );

  return (
    !!formData.nameDesc.name &&
    !!formData.experiment &&
    !!formData.pipeline &&
    !!formData.version &&
    hasMlflowExperimentName &&
    hasRequiredInputParams &&
    runTypeSafeData(formData.runType) &&
    runTypeSafeDates(formData.runType)
  );
};

export const getInputDefinitionParams = (
  version: PipelineVersionKF | null | undefined,
): ParametersKF | undefined => {
  // Return undefined for Argo workflow versions as they don't have root.inputDefinitions
  if (isArgoWorkflow(version?.pipeline_spec)) {
    return undefined;
  }
  return getCorePipelineSpec(version?.pipeline_spec)?.root.inputDefinitions?.parameters;
};
