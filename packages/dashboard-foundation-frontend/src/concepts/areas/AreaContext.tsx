import * as React from 'react';
import {
  DataScienceClusterInitializationKindStatus,
  DataScienceClusterKindStatus,
} from '#~/k8sTypes';
import { IsAreaAvailableStatus, SupportedAreaType } from '#~/concepts/areas/types';

export type AreaContextState = {
  /**
   * If value is `null`:
   *   Using the v1 Operator, no status to pull
   *   TODO: Remove when we no longer want to support v1
   */
  dscStatus: DataScienceClusterKindStatus | null;
  dsciStatus: DataScienceClusterInitializationKindStatus | null;
  areasStatus: Record<SupportedAreaType, IsAreaAvailableStatus | undefined>;
};

export const AreaContext = React.createContext<AreaContextState>({
  dscStatus: null,
  dsciStatus: null,
  areasStatus: {},
});
