import React from 'react';
import {
  SupportedArea,
  useIsAreaAvailable,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import { TRUSTY_CR_NOT_AVAILABLE_STATES } from '@odh-dashboard/model-serving-shared/concepts/trustyai/types';
import { TrustyAIContext } from '@odh-dashboard/trustyai/concepts/context/TrustyAIContext';

const useDoesTrustyAICRExist = (): boolean[] => {
  const trustyAIAreaAvailable = useIsAreaAvailable(SupportedArea.TRUSTY_AI).status;
  const { statusState } = React.useContext(TrustyAIContext);

  const hasCR = !TRUSTY_CR_NOT_AVAILABLE_STATES.includes(statusState.type);

  return [trustyAIAreaAvailable && hasCR];
};

export default useDoesTrustyAICRExist;
