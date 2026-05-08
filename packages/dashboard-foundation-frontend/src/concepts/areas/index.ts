/* eslint-disable no-barrel-files/no-barrel-files */

/*
  This section of concepts is intended to be for all things understanding our state with respect to
  areas of the application and the stack components that may relate.

  This area should not bloat to support specifics of any area, this is just helpers and ways to
  determine the state we are in.
*/
export { default as AreaComponent, conditionalArea } from './AreaComponent';
export { AreaContext } from './AreaContext';
export type { AreaContextState } from './AreaContext';
export {
  techPreviewFlags,
  devTemporaryFeatureFlags,
  coreDashboardFlags,
  projectManagementFlags,
  modelServingFlags,
  advancedAIMLFlags,
  definedFeatureFlags,
  SupportedAreasStateMap,
  DataScienceStackComponentMap,
} from './const';
export { DataScienceStackComponent, SupportedArea } from './types';
export type {
  FeatureFlag,
  IsAreaAvailableStatus,
  SupportedAreaType,
  StackCapability,
  CustomConditionFunction,
  SupportedComponentFlagValue,
  SupportedAreasState,
} from './types';
export { default as useIsAreaAvailable } from './useIsAreaAvailable';
export { default as useFetchDscStatus } from './useFetchDscStatus';
export { default as useFetchDsciStatus } from './useFetchDsciStatus';
export { isDefinedFeatureFlag, getFlags, isAreaAvailable } from './utils';
export type { FlagState, IsAreaAvailableOptions } from './utils';
