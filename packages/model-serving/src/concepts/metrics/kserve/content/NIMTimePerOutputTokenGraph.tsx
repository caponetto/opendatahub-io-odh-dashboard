import React from 'react';
import { TimeframeTitle } from '@odh-dashboard/dashboard-foundation-frontend/concepts/metrics/types';
import MetricsChart from '../../../../pages/screens/metrics/MetricsChart';
import { useFetchNimTimePerOutputTokenData } from '../../../../api/prometheus/kservePerformanceMetrics';
import { convertPrometheusNaNToZero } from '../../../../pages/screens/metrics/utils';
import { MetricsChartTypes } from '../../../../pages/screens/metrics/types';
import { NimMetricGraphDefinition } from '../types';

type NimTimePerOutputTokenGraphProps = {
  graphDefinition: NimMetricGraphDefinition; // Contains query and title
  timeframe: TimeframeTitle; // Time range
  end: number; // End timestamp
  namespace: string; // Namespace
};
const NimTimePerOutputTokenGraph: React.FC<NimTimePerOutputTokenGraphProps> = ({
  graphDefinition,
  timeframe,
  end,
  namespace,
}) => {
  // Fetch the data for "Time per Output Token"
  const {
    data: { timePerOutputToken },
  } = useFetchNimTimePerOutputTokenData(graphDefinition, timeframe, end, namespace);
  return (
    <MetricsChart
      title={graphDefinition.title}
      metrics={{
        metric: {
          ...timePerOutputToken,
          data: convertPrometheusNaNToZero(timePerOutputToken.data),
        },
      }}
      color="blue"
      type={MetricsChartTypes.AREA}
    />
  );
};
export default NimTimePerOutputTokenGraph;
