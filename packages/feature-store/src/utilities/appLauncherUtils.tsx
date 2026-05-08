import React from 'react';
import openshiftLogo from '@odh-dashboard/dashboard-foundation-frontend/images/openshift.svg';
import { getOpenShiftConsoleServerURL } from '@odh-dashboard/dashboard-foundation-frontend/utilities/clusterUtils';
import type { ApplicationAction } from '@odh-dashboard/dashboard-foundation-frontend/types';

export const getOpenShiftConsoleAction = (serverURL?: string): ApplicationAction | null => {
  const href = getOpenShiftConsoleServerURL(serverURL);
  if (!href) {
    return null;
  }

  return {
    label: 'OpenShift Console',
    href,
    image: <img src={openshiftLogo} alt="" />,
  };
};
