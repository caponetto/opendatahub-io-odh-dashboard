import React from 'react';
import { TimeframeTitle } from '@odh-dashboard/dashboard-foundation-frontend/concepts/metrics/types';
import { useFetchKserveRequestCountData } from '../../../../api/prometheus/kservePerformanceMetrics';
import MetricsChart from '../../../../pages/screens/metrics/MetricsChart';
import { KserveMetricGraphDefinition } from '../types';

type KserveRequestCountGraphProps = {
  graphDefinition: KserveMetricGraphDefinition;
  timeframe: TimeframeTitle;
  end: number;
  namespace: string;
};

const KserveRequestCountGraph: React.FC<KserveRequestCountGraphProps> = ({
  graphDefinition,
  timeframe,
  end,
  namespace,
}) => {
  const {
    data: { successCount, failedCount },
  } = useFetchKserveRequestCountData(graphDefinition, timeframe, end, namespace);

  return (
    <MetricsChart
      metrics={[
        {
          name: 'Successful',
          metric: successCount,
        },
        {
          name: 'Failed',
          metric: failedCount,
        },
      ]}
      color="blue"
      title={graphDefinition.title}
      isStack
    />
  );
};

export default KserveRequestCountGraph;
