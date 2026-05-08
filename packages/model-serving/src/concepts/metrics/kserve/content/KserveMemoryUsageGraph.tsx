import React from 'react';

import { TimeframeTitle } from '@odh-dashboard/dashboard-foundation-frontend/concepts/metrics/types';
import { useFetchKserveMemoryUsageData } from '../../../../api/prometheus/kservePerformanceMetrics';
import MetricsChart from '../../../../pages/screens/metrics/MetricsChart';
import { toPercentage } from '../../../../pages/screens/metrics/utils';
import { KserveMetricGraphDefinition } from '../types';

type KserveMemoryUsageGraphProps = {
  graphDefinition: KserveMetricGraphDefinition;
  timeframe: TimeframeTitle;
  end: number;
  namespace: string;
};

const KserveMemoryUsageGraph: React.FC<KserveMemoryUsageGraphProps> = ({
  graphDefinition,
  timeframe,
  end,
  namespace,
}) => {
  const {
    data: { memoryUsage },
  } = useFetchKserveMemoryUsageData(graphDefinition, timeframe, end, namespace);

  return (
    <MetricsChart
      title={graphDefinition.title}
      metrics={{
        metric: memoryUsage,
        translatePoint: toPercentage,
      }}
      color="orange"
      domain={() => ({
        y: [0, 100],
      })}
    />
  );
};

export default KserveMemoryUsageGraph;
