import { ServingRuntimeModelType } from '@odh-dashboard/dashboard-foundation-frontend/types';

export type DeployPrefillData = {
  modelName: string;
  modelUri?: string;
  returnRouteValue?: string;
  cancelReturnRouteValue?: string;
  wizardStartIndex?: number;
  modelType?: ServingRuntimeModelType;
  prefillAlertText?: string;
};
