import React from 'react';
import { TimeframeTitle } from '@odh-dashboard/dashboard-foundation-frontend/concepts/metrics/types';
import { useFetchNimTimeToFirstTokenData } from '../../../../api/prometheus/kservePerformanceMetrics';
import MetricsChart from '../../../../pages/screens/metrics/MetricsChart';
import { convertPrometheusNaNToZero } from '../../../../pages/screens/metrics/utils';
import { NimMetricGraphDefinition } from '../types';

// Graph #4 - Time to First Token
type NimTimeToFirstTokenGraphProps = {
  graphDefinition: NimMetricGraphDefinition;
  timeframe: TimeframeTitle;
  end: number;
  namespace: string;
};

const NimTimeToFirstTokenGraph: React.FC<NimTimeToFirstTokenGraphProps> = ({
  graphDefinition,
  timeframe,
  end,
  namespace,
}) => {
  const {
    data: { timeToFirstToken },
  } = useFetchNimTimeToFirstTokenData(graphDefinition, timeframe, end, namespace);

  return (
    <MetricsChart
      title={graphDefinition.title}
      metrics={{
        metric: { ...timeToFirstToken, data: convertPrometheusNaNToZero(timeToFirstToken.data) },
      }}
      color="blue"
      domain={() => ({
        y: [0, 20],
      })}
    />
  );
};

export default NimTimeToFirstTokenGraph;
