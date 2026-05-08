import * as React from 'react';
import { AppContext } from '@odh-dashboard/dashboard-foundation-frontend/app/AppContext';

const useDefaultPvcSize = (): string => {
  const {
    dashboardConfig: {
      spec: { notebookController },
    },
  } = React.useContext(AppContext);

  return notebookController?.pvcSize || '20Gi';
};

export default useDefaultPvcSize;
