import { ServingRuntimeModelType } from '@odh-dashboard/dashboard-foundation-frontend/types';

export type ModelTypeValue =
  | ServingRuntimeModelType.PREDICTIVE
  | ServingRuntimeModelType.GENERATIVE;

export const isValidModelType = (value: string): value is ModelTypeValue =>
  value === ServingRuntimeModelType.PREDICTIVE || value === ServingRuntimeModelType.GENERATIVE;

export const deploymentStrategyRolling = 'rolling' as const;
export const deploymentStrategyRecreate = 'recreate' as const;
