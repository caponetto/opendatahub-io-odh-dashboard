import * as React from 'react';
import { useSegmentTracking } from '@odh-dashboard/dashboard-foundation-frontend/concepts/analyticsTracking/useSegmentTracking';
import { useTrackHistory } from '@odh-dashboard/dashboard-foundation-frontend/concepts/analyticsTracking/useTrackHistory';

const TelemetrySetup: React.FC = () => {
  useSegmentTracking();
  useTrackHistory();

  return null;
};

export default TelemetrySetup;
